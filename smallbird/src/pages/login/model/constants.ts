export const QUESTION_PHONE_NUMBER = "1661-6213";

export const LOGIN_TABS = ["partner", "creator"] as const;

export type LoginTab = (typeof LOGIN_TABS)[number];

export const DEFAULT_LOGIN_TAB: LoginTab = "partner";

export function isLoginTab(value: string): value is LoginTab {
  return LOGIN_TABS.some((tab) => tab === value);
}
