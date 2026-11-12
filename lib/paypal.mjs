// Shared PayPal helper. Runs ONLY on the server (Netlify Function), so the secret never reaches the browser.
const BASE = 'https://api-m.sandbox.paypal.com'; // sandbox = fake money

// Step 1 of every PayPal call: trade our Client ID + Secret for a short-lived access token.
// Why: PayPal never wants the secret on each request, only a temporary token ("Bearer").
export async function token() {
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error('PayPal token failed: ' + JSON.stringify(data));
  return data.access_token;
}

// Small wrapper: call PayPal with the token, return {status, data}.
export async function paypal(path, { method = 'GET', body } = {}) {
  const t = await token();
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();               // some PayPal replies are empty, so parse by hand
  const data = text ? JSON.parse(text) : {};
  return { ok: res.ok, status: res.status, data };
}

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
