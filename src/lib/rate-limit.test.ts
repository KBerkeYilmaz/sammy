import { rateLimit } from "~/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    const result = rateLimit({ key: "test-allow", limit: 5, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });

  it("should return correct remaining count", () => {
    const key = "test-remaining";
    const opts = { key, limit: 3, windowMs: 60_000 };

    expect(rateLimit(opts).remaining).toBe(2);
    expect(rateLimit(opts).remaining).toBe(1);
    expect(rateLimit(opts).remaining).toBe(0);
  });

  it("should block requests at the limit", () => {
    const key = "test-block";
    const opts = { key, limit: 2, windowMs: 60_000 };

    rateLimit(opts);
    rateLimit(opts);
    const result = rateLimit(opts);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track different keys independently", () => {
    const opts = { limit: 1, windowMs: 60_000 };

    rateLimit({ ...opts, key: "key-a" });
    const resultA = rateLimit({ ...opts, key: "key-a" });
    const resultB = rateLimit({ ...opts, key: "key-b" });

    expect(resultA.success).toBe(false);
    expect(resultB.success).toBe(true);
  });

  it("should clean up expired timestamps after window passes", () => {
    const key = "test-expire";
    const opts = { key, limit: 2, windowMs: 10_000 };

    rateLimit(opts);
    rateLimit(opts);
    expect(rateLimit(opts).success).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(10_001);

    const result = rateLimit(opts);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("should allow requests again after the window expires", () => {
    const key = "test-reset";
    const opts = { key, limit: 1, windowMs: 5_000 };

    rateLimit(opts);
    expect(rateLimit(opts).success).toBe(false);

    vi.advanceTimersByTime(5_001);

    const result = rateLimit(opts);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });
});
