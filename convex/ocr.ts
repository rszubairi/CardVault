import { action } from './_generated/server';
import { v } from 'convex/values';

const REVIEWED_FIELDS = v.object({
  firstName:   v.optional(v.union(v.string(), v.null())),
  lastName:    v.optional(v.union(v.string(), v.null())),
  designation: v.optional(v.union(v.string(), v.null())),
  company:     v.optional(v.union(v.string(), v.null())),
});

export const reviewExtraction = action({
  args: {
    rawText:     v.string(),
    firstName:   v.optional(v.string()),
    lastName:    v.optional(v.string()),
    designation: v.optional(v.string()),
    company:     v.optional(v.string()),
    email:       v.optional(v.string()),
    phone:       v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are reviewing OCR field extraction from a business card. Check for these common errors:
1. Job title/designation mistakenly placed in the name field (e.g. firstName="CEO", lastName="Sales Manager")
2. The person's actual name missing because a title line was chosen instead
3. Company name mixed into the name fields
4. Name parts swapped (first/last reversed on non-Western cards)

Raw card text (one line per OCR line):
${args.rawText}

Current extraction:
- firstName: ${args.firstName ?? '(not found)'}
- lastName: ${args.lastName ?? '(not found)'}
- designation: ${args.designation ?? '(not found)'}
- company: ${args.company ?? '(not found)'}
- email: ${args.email ?? '(not found)'}
- phone: ${args.phone ?? '(not found)'}

Reply with ONLY a JSON object containing ONLY the fields that need correction. Use null to clear a field. If everything looks correct, return {}.
Examples:
{"firstName":"John","lastName":"Smith","designation":"Chief Executive Officer"}
{"firstName":"Ahmad","lastName":"Razali","company":"TechCorp Sdn Bhd"}
{}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages:   [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) return null;

      const data  = await res.json();
      const text  = (data.content?.[0]?.text ?? '').trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;

      const corrections = JSON.parse(match[0]) as Record<string, string | null>;
      // Only return known safe string/null fields
      const safe: Record<string, string | null> = {};
      for (const key of ['firstName', 'lastName', 'designation', 'company']) {
        if (key in corrections) safe[key] = corrections[key] ?? null;
      }
      return Object.keys(safe).length > 0 ? safe : null;
    } catch {
      return null;
    }
  },
});
