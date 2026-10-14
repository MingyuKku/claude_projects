import { ROUTES } from "@/shared/config";

export type LandingDestination =
  | { kind: "internal"; path: typeof ROUTES.main }
  | { kind: "legacy"; path: "/account" };

// `/account` still lives in the legacy Vue app. A SPA navigation never reaches the
// server, so it cannot hit the path-based routing split: legacy needs a full
// page load. Returning `kind` lets callers choose how to navigate.
const LEGACY_ACCOUNT_PATH = "/account";

/** Authority is the server's value; permission rules are not re-implemented here. */
export function landingDestination(authority?: string): LandingDestination {
  return authority === "MASTER" || authority === "ADMIN"
    ? { kind: "internal", path: ROUTES.main }
    : { kind: "legacy", path: LEGACY_ACCOUNT_PATH };
}
