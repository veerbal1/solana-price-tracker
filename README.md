# Solana Price Range Alert (Serverless / Upstash / Telegram)

A lightweight **AWS Lambda** (deployed with the Serverless Framework) that checks the current price of **SOL** every minute, compares it to a configurable range stored in **Upstash Redis**, and sends out a **Telegram** alert when the price drifts outside that band.

> Designed for liquidity-provider (LP) positions—get notified when SOL leaves your chosen range so you can remove or reposition liquidity before impermanent-loss hits.

---

## 🏗 Architecture

1. **Schedule** – AWS CloudWatch triggers the Lambda (`rate(1 minute)`).
2. **Price Fetch** – Lambda calls the Birdeye public API to get the latest SOL price (only when alerts are active).
3. **Redis Cache / Config** –
   * Reads `isActive`, `lowerPrice`, `upperPrice` from Upstash Redis.
   * Writes the freshly-fetched price to `currentPrice` for external dashboards.
4. **Alert Logic** – If `isActive = true` *and* price ≤ `lowerPrice` **OR** price ≥ `upperPrice`, craft a friendly LP alert.
5. **Telegram** – Sends the alert to your chat via Telegram Bot API.

---

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `BIRDEYE_TOKEN` | API key for Birdeye price endpoint |
| `CHAT_ID` | Telegram chat/channel ID that will receive messages |
| `TELEGRAM_BOT_API` | Bot token in the format `bot<token>` or `<token>`¹ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST bearer token |

¹ If you provide the plain token, the code automatically prefixes it with `bot` when calling Telegram.

All of these are mapped in `serverless.yml → provider.environment` so they’re available to Lambda.

---

## 🗄 Redis Keys

| Key | Type | Purpose |
|-----|------|---------|
| `isActive` | boolean | Master switch (`true` = send alerts, `false` = skip *everything*, even the price fetch) |
| `lowerPrice` | number | Lower bound of safe price range |
| `upperPrice` | number | Upper bound of safe price range |
| `currentPrice` | number | The most recent SOL price fetched by Lambda (read-only) |

All keys are set **without any TTL**, so they persist until you change them.

### Setting / Updating Config

```bash
# Toggle alerts
curl -X POST "$UPSTASH_REDIS_REST_URL/SET/isActive/true" \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Update range (example: 177–196)
curl -X POST "$UPSTASH_REDIS_REST_URL/MSET/lowerPrice/177/upperPrice/196" \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

---

## 🚀 Deployment

```bash
# Install deps
npm install

# Deploy to AWS (defined region/stage in serverless.yml)
serverless deploy
```

The stack creates:
* Lambda function `rateHandler` (bundled by esbuild)
* CloudWatch rule that invokes it every minute

To tail logs live:
```bash
serverless logs -f rateHandler -t
```

---

## 🔧 Local Development / Testing

1. Export the same environment variables you use in prod.
2. Run the function locally:
   ```bash
   serverless dev   # hot-reloading
   # or
   serverless invoke local -f rateHandler
   ```
3. Logs will show fetched price, thresholds used, and any Telegram response.

---

## 📜 License

MIT © 2025 Veerbal, Full Stack Engineer
Twitter - https://x.com/veerbal01
