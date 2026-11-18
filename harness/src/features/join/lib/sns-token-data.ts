import { snsTokenDataSchema } from "../model/types";

import type { SnsTokenData } from "../model/types";

/** Reads the SNS identity from router `location.state`; anything else means a normal join. */
export function readSnsTokenData(locationState: unknown): SnsTokenData | null {
  if (typeof locationState !== "object" || locationState === null) return null;
  if (!("tokenData" in locationState)) return null;
  const parsed = snsTokenDataSchema.safeParse(locationState.tokenData);
  return parsed.success ? parsed.data : null;
}
