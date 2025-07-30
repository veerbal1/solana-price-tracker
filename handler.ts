export const run = async () => {
  // Fetch the current SOL price from Birdeye and log the response
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-chain": "solana",
      "X-API-KEY": (globalThis as any).process?.env?.BIRDEYE_TOKEN ?? "",
    },
  } as any;

  const endpoint =
    "https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112&ui_amount_mode=raw";

  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`Birdeye API responded with status ${response.status}`);
    }

    const data = await response.json();

    console.log("Birdeye price data:", JSON.stringify(data, null, 2));

    // ----------------- Send Telegram message -----------------
    const price = data?.data?.value ?? null;

    const telegramToken = (globalThis as any).process?.env?.TELEGRAM_BOT_API;
    const chatId = (globalThis as any).process?.env?.CHAT_ID;

    if (!telegramToken || !chatId) {
      console.warn(
        "TELEGRAM_BOT_API or CHAT_ID env variables are not set. Skipping Telegram notification."
      );
      return;
    }

    const telegramEndpoint = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    const lowerThreshold = 177;
    const upperThreshold = 196;

    if (price === null) {
      console.warn("Price not available. Skipping alert check.");
      return;
    }

    if (price <= lowerThreshold || price >= upperThreshold) {
      let alertText: string;
      const formattedPrice = price.toFixed(2);

      if (price <= lowerThreshold) {
        alertText = `⚠️ SOL price slipped below $${lowerThreshold}.\nCurrent price: $${formattedPrice} 📉\nYour liquidity position may be out of range. Consider removing liquidity or repositioning to mitigate impermanent loss.`;
      } else {
        alertText = `🚀 SOL price surged above $${upperThreshold}.\nCurrent price: $${formattedPrice} 📈\nYour liquidity position may be out of range. Consider removing liquidity or repositioning accordingly.`;
      }

      const telegramBody = {
        chat_id: chatId,
        text: alertText,
      };

      try {
        const telegramResp = await fetch(telegramEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telegramBody),
        });

        if (!telegramResp.ok) {
          throw new Error(
            `Telegram API responded with status ${telegramResp.status}`
          );
        }

        console.log("Telegram alert sent successfully");
      } catch (err) {
        console.error("Failed to send alert to Telegram:", err);
      }
    } else {
      console.log(`Price $${price} within threshold; no alert sent.`);
    }
  } catch (error) {
    console.error("Failed to fetch SOL price from Birdeye:", error);
  }
};
