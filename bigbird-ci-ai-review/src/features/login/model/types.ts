export interface LoginErrorResult {
  /** Text shown under the form. Empty when a flag below drives a screen change. */
  message: string;
  /** Show the account-locked notice popup. */
  locked: boolean;
  /** Send the user to the dormant-account screen. */
  expired: boolean;
}

export interface LoginErrorData {
  reason?: string;
  /** Unlock time or account expiry time, as an ISO string. */
  time?: string;
}

export interface BrandTheme {
  logo: string;
  logoAlt: string;
  /** Logo width: mobile, tablet, desktop. */
  logoClassName: string;
  /** Text under the logo; `\n` is rendered with whitespace-pre-line. */
  tagline: string;
  loginTitle: string;
  /** null keeps the default `--brand`. */
  primaryColor: string | null;
  /** Whether the inquiry entry point in the top right is shown. */
  showQuestion: boolean;
}
