import { describe, expect, it } from "vitest";
import { cn, sanitizeForServer } from "./utils";

describe("cn", () => {
  it("joins truthy class values", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes, keeping the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("sanitizeForServer", () => {
  it("returns null and undefined unchanged", () => {
    expect(sanitizeForServer(null)).toBeNull();
    expect(sanitizeForServer(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(sanitizeForServer(42)).toBe(42);
    expect(sanitizeForServer("hello")).toBe("hello");
    expect(sanitizeForServer(true)).toBe(true);
  });

  it("converts a Firestore timestamp to an ISO string", () => {
    const timestamp = { seconds: 1_600_000_000, nanoseconds: 0 };
    expect(sanitizeForServer(timestamp)).toBe(
      new Date(1_600_000_000 * 1000).toISOString(),
    );
  });

  it("converts nested timestamps within objects and arrays", () => {
    const input = {
      id: "abc",
      createdAt: { seconds: 1_600_000_000, nanoseconds: 0 },
      events: [{ at: { seconds: 1_700_000_000, nanoseconds: 0 } }],
    };
    expect(sanitizeForServer(input)).toEqual({
      id: "abc",
      createdAt: new Date(1_600_000_000 * 1000).toISOString(),
      events: [{ at: new Date(1_700_000_000 * 1000).toISOString() }],
    });
  });

  it("returns the original object when the timestamp is invalid", () => {
    const invalid = { seconds: Number.NaN, nanoseconds: 0 };
    expect(sanitizeForServer(invalid)).toBe(invalid);
  });

  it("leaves plain arrays of primitives intact", () => {
    expect(sanitizeForServer([1, "two", false])).toEqual([1, "two", false]);
  });
});
