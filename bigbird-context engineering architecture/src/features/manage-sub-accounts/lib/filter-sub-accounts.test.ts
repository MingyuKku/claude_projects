import { filterSubAccounts } from "./filter-sub-accounts";

import type { SubAccountViewModel } from "../model/types";

const accounts: SubAccountViewModel[] = [
  {
    accountIdx: 1,
    identifier: "sub01",
    name: "김담당",
    email: "a@bigbird.com",
    createdAt: new Date(),
  },
  {
    accountIdx: 2,
    identifier: "market",
    name: "이마케팅",
    email: "m@bigbird.com",
    createdAt: new Date(),
  },
];

describe("filterSubAccounts", () => {
  it("검색어가 없으면 전부 돌려준다", () => {
    expect(filterSubAccounts(accounts, "  ")).toHaveLength(2);
  });

  it("아이디·담당자명·이메일 어디든 포함하면 찾는다(대소문자 무시)", () => {
    expect(filterSubAccounts(accounts, "SUB")).toHaveLength(1);
    expect(filterSubAccounts(accounts, "마케팅")).toHaveLength(1);
    expect(filterSubAccounts(accounts, "m@big")).toHaveLength(1);
  });

  it("맞는 항목이 없으면 비어 있다", () => {
    expect(filterSubAccounts(accounts, "없는검색어")).toEqual([]);
  });
});
