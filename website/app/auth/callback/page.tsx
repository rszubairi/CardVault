'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Forward all query params to the app via deep link
    const params = searchParams.toString();
    const deepLink = `cardvault://auth${params ? `?${params}` : ''}`;
    window.location.href = deepLink;
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
      <p style={{ color: '#94a3b8', fontFamily: 'sans-serif' }}>Redirecting back to CardVault...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
