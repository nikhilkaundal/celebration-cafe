/**
 * Lightweight Sliding Window Rate Limiter for Next.js API Routes.
 * Tracks request counts per key (IP address or user ID) in memory.
 */

interface RateLimitEntry {
  tokens: number;
  lastReset: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastReset > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit: number;      // Maximum requests allowed
  windowMs: number;   // Time window in milliseconds
}

export function checkRateLimit(
  identifier: string,
  prefix: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): { success: boolean; remaining: number; resetMs: number } {
  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now - entry.lastReset > options.windowMs) {
    entry = { tokens: options.limit - 1, lastReset: now };
    store.set(key, entry);
    return {
      success: true,
      remaining: entry.tokens,
      resetMs: options.windowMs,
    };
  }

  if (entry.tokens > 0) {
    entry.tokens -= 1;
    store.set(key, entry);
    return {
      success: true,
      remaining: entry.tokens,
      resetMs: options.windowMs - (now - entry.lastReset),
    };
  }

  // Limit exceeded
  return {
    success: false,
    remaining: 0,
    resetMs: options.windowMs - (now - entry.lastReset),
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
