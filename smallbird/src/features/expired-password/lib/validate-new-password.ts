import { PASSWORD_PATTERN } from "@/entities/account";

import { FORBIDDEN_WORDS } from "../model/constants";

export function isValidNewPassword(value: string): boolean {
  const lowered = value.toLowerCase();
  return (
    PASSWORD_PATTERN.test(value) &&
    !FORBIDDEN_WORDS.some((word) => lowered.includes(word))
  );
}
