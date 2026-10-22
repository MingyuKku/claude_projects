export const LINK_SUCCESS_CODE = 200;

export const TABS = [
  { key: "signup", labelKey: "tab.signup" },
  { key: "link", labelKey: "tab.link" },
] as const;

export type Tab = (typeof TABS)[number]["key"];
