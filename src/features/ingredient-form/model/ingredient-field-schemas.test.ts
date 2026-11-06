import { describe, expect, it } from "vitest";

import {
  ingredientQuantitySchema,
  ingredientWeightValueSchema,
} from "./ingredient-field-schemas";

describe("ingredient quantity validation", () => {
  it.each([
    ["1", 1],
    ["100", 100],
  ])("accepts %s within the COUNT range", (input, expected) => {
    expect(ingredientQuantitySchema.parse(input)).toBe(expected);
  });

  it.each(["", "0", "1.5", "101"])(
    "rejects %s outside the COUNT integer range",
    (input) => {
      expect(ingredientQuantitySchema.safeParse(input).success).toBe(false);
    },
  );
});

describe("ingredient weight validation", () => {
  it("treats an empty optional weight as null", () => {
    expect(ingredientWeightValueSchema.parse("")).toBeNull();
  });

  it.each([
    ["0.01", 0.01],
    ["150.5", 150.5],
    ["50000", 50_000],
  ])("accepts %s within the WEIGHT range", (input, expected) => {
    expect(ingredientWeightValueSchema.parse(input)).toBe(expected);
  });

  it.each(["0", "0.001", "1.234", "50001"])(
    "rejects %s outside the WEIGHT range",
    (input) => {
      expect(ingredientWeightValueSchema.safeParse(input).success).toBe(false);
    },
  );
});
