interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.cache.get(identifier);

    if (!entry) {
      // First attempt
      this.cache.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > entry.resetTime) {
      // Reset window
      this.cache.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (entry.count >= this.maxAttempts) {
      return true; // Rate limited
    }

    // Increment count
    entry.count++;
    return false;
  }

  reset(identifier: string): void {
    this.cache.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}

// Global rate limiter instances
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const schoolCodeRateLimiter = new RateLimiter(10, 5 * 60 * 1000); // 10 attempts per 5 minutes

// Cleanup old entries every 30 minutes
setInterval(() => {
  loginRateLimiter.cleanup();
  schoolCodeRateLimiter.cleanup();
}, 30 * 60 * 1000);
