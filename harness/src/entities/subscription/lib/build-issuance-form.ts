import type { SubscriptionIssuanceResponse } from "../model/schema";
import type { IssuanceForm } from "../model/types";

/** 결제창 주소만 `action`으로 빼고 나머지 값은 이름 그대로 form 필드로 둠. `null`은 빈 값으로 보냄. */
export function buildIssuanceForm(
  response: SubscriptionIssuanceResponse,
): IssuanceForm {
  const { issuanceUrl, ...rest } = response;
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(rest)) {
    fields[name] = value === null ? "" : String(value);
  }
  return { action: issuanceUrl, fields };
}
