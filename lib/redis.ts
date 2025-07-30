import { Redis } from "@upstash/redis";

// Single Redis instance pulled from environment variables (UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN)
const redis = Redis.fromEnv();

/**
 * Get price range configuration from Redis
 */
export async function getPriceRange(): Promise<{
  isActive: boolean;
  lowerPrice: number | null;
  upperPrice: number | null;
}> {
  const [isActiveRaw, lowerRaw, upperRaw] = await Promise.all([
    redis.get<boolean>("isActive"),
    redis.get<number>("lowerPrice"),
    redis.get<number>("upperPrice"),
  ]);

  const isActive =
    isActiveRaw === null || isActiveRaw === undefined
      ? true // default active when key missing
      : Boolean(isActiveRaw);

  return {
    isActive,
    lowerPrice: lowerRaw ?? null,
    upperPrice: upperRaw ?? null,
  };
}

/**
 * Save current price to Redis
 */
export async function setCurrentPrice(price: number): Promise<void> {
  await redis.set("currentPrice", price);
}

/**
 * Get current price from Redis
 */
export async function getCurrentPrice(): Promise<number | null> {
  const price = await redis.get<number>("currentPrice");
  return price ?? null;
}

/**
 * Set price range configuration in Redis
 */
export async function setPriceRange(
  isActive: boolean,
  lowerPrice: number,
  upperPrice: number
): Promise<void> {
  await Promise.all([
    redis.set("isActive", isActive),
    redis.set("lowerPrice", lowerPrice),
    redis.set("upperPrice", upperPrice),
  ]);
} 