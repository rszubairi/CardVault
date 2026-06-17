import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api, internal } from './_generated/api';

const http = httpRouter();

// ─── Stripe signature verification ───────────────────────────────────────────

async function verifyStripeSignature(
  payload: string,
  header:  string,
  secret:  string,
): Promise<boolean> {
  const parts = header.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const sig       = parts['v1'];
  if (!timestamp || !sig) return false;

  const signed = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const computed = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === sig;
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

http.route({
  path:    '/stripe/webhook',
  method:  'POST',
  handler: httpAction(async (ctx, req) => {
    const body   = await req.text();
    const sigHeader = req.headers.get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !sigHeader) {
      return new Response('Webhook secret not configured', { status: 400 });
    }

    const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
    if (!valid) {
      return new Response('Invalid signature', { status: 400 });
    }

    let event: { type: string; data: { object: unknown } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    await ctx.runMutation(api.subscriptions.handleStripeWebhook, {
      event: event.type,
      data:  event.data.object,
    });

    return new Response('OK', { status: 200 });
  }),
});

// ─── Success / cancel redirect pages ──────────────────────────────────────────

http.route({
  path:    '/stripe/success',
  method:  'GET',
  handler: httpAction(async (_ctx, _req) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="3;url=cardvault://upgrade-success">
<title>Payment Successful</title>
<style>body{font-family:sans-serif;background:#0F172A;color:#E2E8F0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;}
h1{color:#10B981;}p{color:#94A3B8;}a{color:#6366F1;}</style></head>
<body><h1>✓ Payment Successful</h1>
<p>Welcome to CardVault Pro! Returning to the app…</p>
<p>If the app doesn't open, <a href="cardvault://upgrade-success">tap here</a>.</p></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }),
});

http.route({
  path:    '/stripe/cancel',
  method:  'GET',
  handler: httpAction(async (_ctx, _req) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="2;url=cardvault://upgrade-cancel">
<title>Payment Cancelled</title>
<style>body{font-family:sans-serif;background:#0F172A;color:#E2E8F0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;}
p{color:#94A3B8;}a{color:#6366F1;}</style></head>
<body><p>Payment cancelled. Returning to the app…</p>
<p><a href="cardvault://upgrade-cancel">Tap here</a> if it doesn't open.</p></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }),
});

// ─── Google OAuth callback ────────────────────────────────────────────────────
// Google redirects here after user signs in. We pass the code back to the app
// via a deep-link so the client can complete the PKCE exchange it started.

http.route({
  path:   '/auth/google',
  method: 'GET',
  handler: httpAction(async (_ctx, req) => {
    const url    = new URL(req.url);
    const code   = url.searchParams.get('code');
    const state  = url.searchParams.get('state');
    const error  = url.searchParams.get('error');

    if (error || !code) {
      const appUrl = `cardvault://auth?error=${encodeURIComponent(error ?? 'no_code')}`;
      return new Response(null, { status: 302, headers: { Location: appUrl } });
    }

    const params = new URLSearchParams({ code, ...(state ? { state } : {}) });
    const appUrl = `cardvault://auth?${params.toString()}`;
    return new Response(null, { status: 302, headers: { Location: appUrl } });
  }),
});

// ─── Admin API ────────────────────────────────────────────────────────────────

function isAdminAuthorized(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

http.route({
  path:    '/admin/stats',
  method:  'GET',
  handler: httpAction(async (ctx, req) => {
    if (!isAdminAuthorized(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    const stats = await ctx.runQuery(internal.admin.getStats, {});
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }),
});

http.route({
  path:    '/admin/users',
  method:  'GET',
  handler: httpAction(async (ctx, req) => {
    if (!isAdminAuthorized(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    const users = await ctx.runQuery(internal.admin.listUsers, {});
    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }),
});

export default http;
