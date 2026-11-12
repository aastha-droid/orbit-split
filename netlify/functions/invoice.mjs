// BACKUP VERSION (Orders API v2). Same name and same reply shape as the invoice version,
// so index.html does not need to change.
// POST {name, amount, email} -> {id, payLink}
import { paypal, json } from '../../lib/paypal.mjs';

export default async (req) => {
  try {
    const { name, amount } = await req.json();

    // Where PayPal sends the buyer after they approve. We just send them back to our own site.
    const origin = new URL(req.url).origin;

    const r = await paypal('/v2/checkout/orders', {
      method: 'POST',
      body: {
        intent: 'CAPTURE',   // CAPTURE = take the money right after the buyer approves
        purchase_units: [{
          description: `Orbit Split - ${name}'s share`,
          amount: { currency_code: 'AUD', value: Number(amount).toFixed(2) },  // string like "900.00"
        }],
        payment_source: {
          paypal: {
            experience_context: {
              user_action: 'PAY_NOW',
              return_url: origin,
              cancel_url: origin,
            },
          },
        },
      },
    });
    if (!r.ok) return json({ error: 'create order failed', detail: r.data }, 502);

    // The link the buyer opens to log in and approve. PayPal names it "payer-action" (newer) or "approve" (older).
    const payLink = r.data.links?.find(l => l.rel === 'payer-action' || l.rel === 'approve')?.href || null;

    return json({ id: r.data.id, payLink });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};
