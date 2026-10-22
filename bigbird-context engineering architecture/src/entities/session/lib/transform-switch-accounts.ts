import type {
  SwitchAccountList,
  SwitchAccountViewModel,
} from "../model/switch-account-schema";

// 목록에서 항상 맨 앞에 두는 본사 계정의 식별자.
const PRIMARY_ACCOUNT_IDENTIFIER = "bigbird";

export function transformSwitchAccountsToViewModel(
  response: SwitchAccountList,
): SwitchAccountViewModel[] {
  return response.clientList
    .map((account) => ({
      identifier: account.id,
      userIdx: account.user_idx,
      companyName: account.company_name ?? "",
    }))
    .sort(
      (a, b) =>
        Number(b.identifier === PRIMARY_ACCOUNT_IDENTIFIER) -
        Number(a.identifier === PRIMARY_ACCOUNT_IDENTIFIER),
    );
}
