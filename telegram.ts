/**
 * Send a message to Telegram
 */
export async function sendTelegram(text: string): Promise<void> {
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
} 