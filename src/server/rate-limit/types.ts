export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export interface RateLimiter {
  check(input: RateLimitInput): Promise<RateLimitResult>;
}

export interface RateLimitStore {
  increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetAt: Date }>;
}
