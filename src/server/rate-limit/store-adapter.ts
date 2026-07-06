import type {
  RateLimitInput,
  RateLimitResult,
  RateLimiter,
  RateLimitStore,
} from "@/server/rate-limit/types";

export class StoreBackedRateLimiter implements RateLimiter {
  constructor(private readonly store: RateLimitStore) {}

  async check(input: RateLimitInput): Promise<RateLimitResult> {
    const { count, resetAt } = await this.store.increment(
      input.key,
      input.windowMs
    );

    return {
      allowed: count <= input.limit,
      limit: input.limit,
      remaining: Math.max(input.limit - count, 0),
      resetAt,
    };
  }
}

export function createStoreBackedRateLimiter(store: RateLimitStore) {
  return new StoreBackedRateLimiter(store);
}
