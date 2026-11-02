import { isValidNewPassword } from "./validate-new-password";

describe("isValidNewPassword", () => {
  it("accepts letters, digits and specials", () => {
    expect(isValidNewPassword("Abcd1234!")).toBe(true);
  });

  it("rejects a password without special characters", () => {
    expect(isValidNewPassword("abcd12345")).toBe(false);
  });

  it("rejects forbidden words regardless of case", () => {
    expect(isValidNewPassword("BigBird123!")).toBe(false);
    expect(isValidNewPassword("xadmin123!")).toBe(false);
  });
});
