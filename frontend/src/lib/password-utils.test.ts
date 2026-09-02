import { describe, expect, it } from "vitest";
import { checkPasswordCriteria, generateStrongPassword } from "./password-utils";

describe("Password Utilities", () => {
  describe("checkPasswordCriteria", () => {
    it("evaluates empty password as too weak with 0 score", () => {
      const result = checkPasswordCriteria("");
      expect(result.score).toBe(0);
      expect(result.label).toBe("Too Weak");
      expect(result.hasMinLength).toBe(false);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasNumber).toBe(false);
      expect(result.hasSpecial).toBe(false);
    });

    it("detects individual criteria correctly", () => {
      // only lowercase
      expect(checkPasswordCriteria("abc").hasLowercase).toBe(true);
      expect(checkPasswordCriteria("abc").hasUppercase).toBe(false);

      // uppercase + number
      const upperNum = checkPasswordCriteria("ABC12");
      expect(upperNum.hasUppercase).toBe(true);
      expect(upperNum.hasNumber).toBe(true);
      expect(upperNum.hasLowercase).toBe(false);
      expect(upperNum.hasMinLength).toBe(false);

      // 8+ chars
      expect(checkPasswordCriteria("12345678").hasMinLength).toBe(true);

      // special char
      expect(checkPasswordCriteria("Hello@").hasSpecial).toBe(true);
    });

    it("evaluates strong password with all criteria satisfied", () => {
      const result = checkPasswordCriteria("SuperP@ssw0rd123!");
      expect(result.score).toBe(5);
      expect(result.percentage).toBe(100);
      expect(result.label).toBe("Strong & Secure");
      expect(result.hasMinLength).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecial).toBe(true);
    });
  });

  describe("generateStrongPassword", () => {
    it("generates a password meeting all 5 security criteria", () => {
      const pwd = generateStrongPassword(16);
      expect(pwd.length).toBe(16);
      const criteria = checkPasswordCriteria(pwd);
      expect(criteria.score).toBe(5);
      expect(criteria.hasMinLength).toBe(true);
      expect(criteria.hasUppercase).toBe(true);
      expect(criteria.hasLowercase).toBe(true);
      expect(criteria.hasNumber).toBe(true);
      expect(criteria.hasSpecial).toBe(true);
    });
  });
});
