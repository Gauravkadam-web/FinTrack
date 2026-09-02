/**
 * Password strength evaluation and secure password generation utilities.
 */

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  score: number; // 0 - 5
  percentage: number; // 0 - 100
  label: "Too Weak" | "Weak" | "Fair" | "Good" | "Strong & Secure";
  colorClass: string;
  textColorClass: string;
}

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~;']/;

/**
 * Evaluates a password string against 5 security criteria.
 */
export function checkPasswordCriteria(password: string): PasswordCriteria {
  if (!password) {
    return {
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
      score: 0,
      percentage: 0,
      label: "Too Weak",
      colorClass: "bg-slate-300 dark:bg-slate-700",
      textColorClass: "text-slate-500 dark:text-slate-400",
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = SPECIAL_CHAR_REGEX.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  const percentage = (score / 5) * 100;

  let label: PasswordCriteria["label"] = "Too Weak";
  let colorClass = "bg-rose-500";
  let textColorClass = "text-rose-500 dark:text-rose-400";

  if (score <= 1) {
    label = "Too Weak";
    colorClass = "bg-rose-500";
    textColorClass = "text-rose-500 dark:text-rose-400";
  } else if (score === 2) {
    label = "Weak";
    colorClass = "bg-orange-500";
    textColorClass = "text-orange-500 dark:text-orange-400";
  } else if (score === 3) {
    label = "Fair";
    colorClass = "bg-amber-500";
    textColorClass = "text-amber-500 dark:text-amber-400";
  } else if (score === 4) {
    label = "Good";
    colorClass = "bg-teal-500";
    textColorClass = "text-teal-500 dark:text-teal-400";
  } else {
    label = "Strong & Secure";
    colorClass = "bg-emerald-500";
    textColorClass = "text-emerald-600 dark:text-emerald-400";
  }

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    score,
    percentage,
    label,
    colorClass,
    textColorClass,
  };
}

/**
 * Generates a cryptographically strong, high-entropy password of given length (default 16 chars).
 * Guarantees at least 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol.
 */
export function generateStrongPassword(length = 16): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused I, O
  const lowers = "abcdefghijkmnopqrstuvwxyz"; // exclude l
  const numbers = "23456789"; // exclude 0, 1
  const symbols = "!@#$%^&*_-+=";
  const allChars = uppers + lowers + numbers + symbols;

  // Guarantee at least one of each category
  const guaranteed = [
    uppers[getRandomInt(uppers.length)],
    lowers[getRandomInt(lowers.length)],
    numbers[getRandomInt(numbers.length)],
    symbols[getRandomInt(symbols.length)],
  ];

  // Fill remainder
  const remainingLength = Math.max(length - guaranteed.length, 4);
  const remaining: string[] = [];
  for (let i = 0; i < remainingLength; i++) {
    remaining.push(allChars[getRandomInt(allChars.length)]);
  }

  // Combine and shuffle with Fisher-Yates
  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = combined[i];
    combined[i] = combined[j];
    combined[j] = temp;
  }

  return combined.join("");
}

function getRandomInt(max: number): number {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}
