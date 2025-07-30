/**
 * Fetch SOL price from Birdeye API
 */
export async function fetchSolPrice(): Promise<number | null> {
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

    return data?.data?.value ?? null;
  } catch (error) {
    console.error("Failed to fetch SOL price from Birdeye:", error);
    throw error;
  }
} 