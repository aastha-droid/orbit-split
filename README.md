# Orbit Split

Split any bill by describing it in plain words. Gemini works out who owes what, PayPal sandbox orders collect each share, and each person's astronaut boards the rocket as they pay. When everyone is aboard, the rocket launches.

- **Live demo:** [add Netlify link after deploy]
- **Devpost project:** [add Devpost link]
- **Demo video:** [add YouTube link]

## Why we built it
Splitting a bill always ends in awkward math and chasing friends for money. We wanted to type a sentence and have the rest handled.

## AI used
- **Google Gemini** (`gemini-3.5-flash-lite`, with `gemini-3.1-flash-lite` as fallback) reads the bill text and returns each person's share as JSON. The page then checks that the amounts add up to the total.
- Claude was used to help write and debug the code.

## PayPal
- Uses the **PayPal Orders API v2** in the **sandbox**, with AUD. Each person gets an order and an approval link.
- PayPal's payment page isn't available from Bangladesh, so the payment tap is simulated in the demo. The orders themselves are real sandbox orders.

## Hackathon
Built for the **PayPal AI Hackathon** on Devpost, November 2026.

## Team
- Aastha (builder)
- Sajid (created the PayPal developer account in Australia)

## Run it locally
1. Install Node.js and run `npm install -g netlify-cli`.
2. Copy `.env.example` to `.env` and fill in your own keys. Never commit `.env`.
3. In this folder, run `netlify dev` and open http://localhost:8888.

## License
MIT. See `LICENSE`.
