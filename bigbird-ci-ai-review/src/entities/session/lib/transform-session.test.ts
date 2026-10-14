import { transformSessionToViewModel } from "./transform-session";

import type { Session } from "../model/schema";

const base: Session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: null,
  identifier: "hong1234",
  email: "a@b.com",
  phone: "01012345678",
};

const ALL_TRUE = {
  requestCampaign: true,
  openShop: true,
  currentSituation: true,
  settlement: true,
  customerService: true,
};

describe("transformSessionToViewModel", () => {
  it("grants every permission to MASTER and ADMIN", () => {
    expect(transformSessionToViewModel(base).subPermissions).toEqual(ALL_TRUE);
    expect(
      transformSessionToViewModel({ ...base, authority: "ADMIN" })
        .subPermissions,
    ).toEqual(ALL_TRUE);
  });

  it("ignores SUB flags for MASTER", () => {
    const vm = transformSessionToViewModel({
      ...base,
      isSettlementAccess: false,
    });
    expect(vm.subPermissions.settlement).toBe(true);
  });

  it("uses the server flags for SUB", () => {
    const vm = transformSessionToViewModel({
      ...base,
      authority: "SUB",
      isOpenShopAccess: true,
      isSettlementAccess: true,
    });
    expect(vm.subPermissions).toEqual({
      requestCampaign: false,
      openShop: true,
      currentSituation: false,
      settlement: true,
      customerService: false,
    });
  });

  it("denies a SUB permission the server did not send", () => {
    const vm = transformSessionToViewModel({ ...base, authority: "SUB" });
    expect(Object.values(vm.subPermissions)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("prefers the nickname for the display name", () => {
    expect(
      transformSessionToViewModel({ ...base, nickname: "홍길동" }).displayName,
    ).toBe("홍길동");
  });

  it("falls back to the identifier without a nickname", () => {
    expect(transformSessionToViewModel(base).displayName).toBe("hong1234");
  });

  it("exposes the authorization result as isAllowed", () => {
    expect(
      transformSessionToViewModel({ ...base, result: false }).isAllowed,
    ).toBe(false);
  });
});
