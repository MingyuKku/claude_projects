/** Kakao Talk consult channel, shared by the inquiry panel and the account-lock notice. */
export const KAKAO_CHAT_URL = "http://pf.kakao.com/_FvvFj/chat";

/** Service number used by the member backend (client=1, brands=2, influencer=3, market=4). */
export const SERVICE_INDEX = 1;

/**
 * `serviceId` sent to the unified auth server's `/lookup`: 1 = Bigbird advertiser.
 * This only pins what the UI sends; isolation between services depends on the
 * auth server filtering by serviceId, not on this constant.
 */
export const AUTH_SERVICE_ID = 1;

/** KMC identity-verification init slug (`/cert/init/{slug}`). It is a string, not a number. */
export const CERT_SLUG = "client";
