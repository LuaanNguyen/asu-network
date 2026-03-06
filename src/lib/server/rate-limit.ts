type RateLimitResult = {
  allowed: boolean;
  retryAfterSec: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

export function consumeMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const current = memoryBuckets.get(key);

  if (!current || current.resetAt <= now) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  memoryBuckets.set(key, current);
  return { allowed: true, retryAfterSec: 0 };
}
