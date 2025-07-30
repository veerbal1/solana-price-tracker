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

  // Helper to send a Telegram message
  const sendTelegram = async (text: string) => {
    const telegramToken = (globalThis as any).process?.env?.TELEGRAM_BOT_API;
    const chatId = (globalThis as any).process?.env?.CHAT_ID;

    if (!telegramToken || !chatId) {
      console.warn(
        "TELEGRAM_BOT_API or CHAT_ID env variables are not set. Skipping Telegram notification."
      );
      return;
    }

    const telegramEndpoint = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    try {
      const resp = await fetch(telegramEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });

      if (!resp.ok) {
        console.error(`Telegram API responded with status ${resp.status}`);
      } else {
        console.log("Telegram message sent successfully");
      }
    } catch (err) {
      console.error("Failed to send message to Telegram:", err);
    }
  };

  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`Birdeye API responded with status ${response.status}`);
    }

    const data = await response.json();

    console.log("Birdeye price data:", JSON.stringify(data, null, 2));

    // ----------------- Send Telegram message -----------------
    const price = data?.data?.value ?? null;

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

      await sendTelegram(alertText);
    } else {
      console.log(`Price $${price} within threshold; no alert sent.`);
    }
  } catch (error) {
    console.error("Failed to fetch SOL price from Birdeye:", error);
    await sendTelegram(`❗ Error fetching SOL price or processing alert: ${error}`);
  }
};
