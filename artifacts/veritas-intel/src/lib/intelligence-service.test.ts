import { describe, expect, it } from "vitest";
import { validateSouthAfricanID } from "./intelligence-service";

describe("validateSouthAfricanID", () => {
  it("rejects values that are not exactly 13 digits", () => {
    expect(validateSouthAfricanID("123")).toEqual({ isValid: false });
    expect(validateSouthAfricanID("80010150090870")).toEqual({
      isValid: false,
    });
    expect(validateSouthAfricanID("80010150090a7")).toEqual({ isValid: false });
    expect(validateSouthAfricanID("")).toEqual({ isValid: false });
  });

  it("rejects IDs that fail the Luhn checksum", () => {
    expect(validateSouthAfricanID("8501015000080")).toEqual({ isValid: false });
  });

  it("decodes a valid male SA-citizen ID", () => {
    expect(validateSouthAfricanID("8001015009087")).toEqual({
      isValid: true,
      metadata: {
        dob: "1980-01-01",
        gender: "Male",
        citizenship: "SA Citizen",
      },
    });
  });

  it("decodes a valid female permanent-resident ID", () => {
    expect(validateSouthAfricanID("9506150000187")).toEqual({
      isValid: true,
      metadata: {
        dob: "1995-06-15",
        gender: "Female",
        citizenship: "Permanent Resident",
      },
    });
  });
});
