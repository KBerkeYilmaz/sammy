/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for single-instance deployments (Vercel serverless resets on cold start).
 * For multi-instance production, replace with @upstash/ratelimit + Redis.
 */

const requests = new Map<string, number[]>();

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { success: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = requests.get(key) ?? [];

  // Remove expired timestamps
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    requests.set(key, valid);
    return { success: false, remaining: 0 };
  }

  valid.push(now);
  requests.set(key, valid);
  return { success: true, remaining: limit - valid.length };
}
