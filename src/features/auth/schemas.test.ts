import { describe, expect, it } from "vitest";
import { registrationSchema } from "./schemas";

describe("registrationSchema", () => {
  it("normalizes the name and email and accepts a valid registration", () => {
    expect(
      registrationSchema.parse({
        name: "  Library Member  ",
        email: "  MEMBER@example.com ",
        password: "secure-password",
      }),
    ).toEqual({
      name: "Library Member",
      email: "member@example.com",
      password: "secure-password",
    });
  });

  it.each([
    { name: "A", email: "member@example.com", password: "secure-password" },
    {
      name: "Valid Name",
      email: "not-an-email",
      password: "secure-password",
    },
    { name: "Valid Name", email: "member@example.com", password: "short" },
  ])("rejects invalid registration data", (input) => {
    expect(registrationSchema.safeParse(input).success).toBe(false);
  });
});
