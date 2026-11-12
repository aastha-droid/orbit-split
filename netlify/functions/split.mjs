// POST {text} -> {total, people:[{name, amount}]}
// Gemini only SUGGESTS the split. The page re-adds the numbers before showing anything.
import { json } from '../../lib/paypal.mjs';

const PROMPT = `You are a bill splitter. Read the user's message about a shared bill.
Return ONLY JSON in exactly this shape:
{"total": <number>, "people": [{"name": "<string>", "amount": <number>}]}
Rules:
- Include every person who shares the bill, including the narrator ("I"/"me") - use the name they give, otherwise "Me".
- Amounts are whole numbers (no decimals) and MUST add up exactly to total.
- Split fairly by what each person had; shared items are divided equally among the people who shared them.
- Never invent people. If you cannot split it, return {"total": 0, "people": []}.`;

export default async (req) => {
  try {
    const { text } = await req.json();
    const main = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    // Optional second model (GEMINI_FALLBACK_MODEL in .env) used if the first stays overloaded
    const fallback = process.env.GEMINI_FALLBACK_MODEL;
    // Try the main model twice, then the fallback once. An overloaded (503) model often works a second later.
    const attempts = [main, main, fallback].filter(Boolean);

    let last;
    for (const model of attempts) {
      // Each attempt gets its own 9s limit so one hang can't use up the whole 30s
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 9000);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          signal: ctrl.signal,
          // The key goes in a header, never in the URL, so it can't leak into logs.
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${PROMPT}\n\nMessage:\n${text}` }] }],
            // thinkingLevel 'low': this is a simple split, it doesn't need deep reasoning
                      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        });
        const data = await res.json();
        if (res.ok) {
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          return json(JSON.parse(raw));
        }
        last = data;
        // Only retry when Google says "busy" (503) or "slow down" (429); other errors won't fix themselves
        if (res.status !== 503 && res.status !== 429) break;
      } catch (e) {
        last = { error: String(e) };
      } finally {
        clearTimeout(timer);
      }
      await new Promise((r) => setTimeout(r, 1000)); // short pause before the next try
    }
    return json({ error: 'Gemini error', detail: last }, 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};