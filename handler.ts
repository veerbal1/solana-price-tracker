import { getPriceRange, setCurrentPrice } from "./lib/redis";
import { sendTelegram } from "./lib/telegram";
import { fetchSolPrice } from "./lib/birdeye";

export const run = async () => {
  try {
    // Get price range configuration from Redis
    const priceConfig = await getPriceRange();
    
    // Check if alerts are active first - skip everything if inactive
    if (!priceConfig.isActive) {
      console.log("Price alerts are disabled. Skipping all processing.");
      return;
    }

    // Fetch SOL price only if alerts are active
    const price = await fetchSolPrice();
    
    if (price === null) {
      console.warn("Price not available. Skipping alert check.");
      return;
    }

    // Save current price to Redis
    await setCurrentPrice(price);

    // Use fallback values if Redis doesn't have the thresholds set
    const lowerThreshold = priceConfig.lowerPrice ?? 177;
    const upperThreshold = priceConfig.upperPrice ?? 196;

    console.log(`Using thresholds: lower=${lowerThreshold}, upper=${upperThreshold}`);

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
    console.error("Error in price monitoring:", error);
    await sendTelegram(`❗ Error fetching SOL price or processing alert: ${error}`);
  }
};
