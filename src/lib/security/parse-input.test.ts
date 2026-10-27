import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseFormData } from "./parse-input";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
});

describe("parseFormData", () => {
  it("parses valid FormData fields", () => {
    const formData = new FormData();
    formData.set("name", "  Ada  ");
    formData.set("email", "ada@example.com");

    const result = parseFormData(schema, formData, ["name", "email"]);
    expect(result).toEqual({
      success: true,
      data: { name: "Ada", email: "ada@example.com" },
    });
  });

  it("rejects invalid FormData", () => {
    const formData = new FormData();
    formData.set("name", "A");
    formData.set("email", "not-an-email");

    expect(parseFormData(schema, formData, ["name", "email"]).success).toBe(
      false,
    );
  });
});
