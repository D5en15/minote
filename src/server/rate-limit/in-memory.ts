import type {
  RateLimitInput,
  RateLimitResult,
  RateLimiter,
} from "@/server/rate-limit/types";

type Bucket = {
  count: number;
  resetAt: number;
};

export class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();

  async check(input: RateLimitInput): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.buckets.get(input.key);
    const bucket =
      existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + input.windowMs };

    bucket.count += 1;
    this.buckets.set(input.key, bucket);

    const remaining = Math.max(input.limit - bucket.count, 0);

    return {
      allowed: bucket.count <= input.limit,
      limit: input.limit,
      remaining,
      resetAt: new Date(bucket.resetAt),
    };
  }

  sweepExpired(now = Date.now()) {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

export const developmentRateLimiter = new InMemoryRateLimiter();
