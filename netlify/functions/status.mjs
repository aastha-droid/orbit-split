// BACKUP VERSION (Orders API v2). GET ?id=ORDER_ID -> {status, paid}
// Orders have an extra step invoices don't: after the buyer APPROVES, the money has not moved yet.
// We must CAPTURE it. The page polls this every 3 s, so we capture here the first time we see APPROVED.
import { paypal, json } from '../../lib/paypal.mjs';

export default async (req) => {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return json({ error: 'missing id' }, 400);

    const o = await paypal(`/v2/checkout/orders/${encodeURIComponent(id)}`);
    if (!o.ok) return json({ error: 'get order failed', detail: o.data }, 502);
    let status = o.data.status;   // CREATED -> PAYER_ACTION_REQUIRED -> APPROVED -> COMPLETED

    if (status === 'APPROVED') {
      const c = await paypal(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, { method: 'POST', body: {} });
      // If two polls race, the second capture fails because it is already done; that is fine,
      // the next poll will read COMPLETED.
      if (c.ok) status = c.data.status;   // COMPLETED
    }

    // The page only checks `paid`, so we map "captured" to the same word the invoice version used.
    if (status === 'COMPLETED') return json({ status: 'PAID', paid: true });
    return json({ status, paid: false });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};
