import { sessionSchema } from "../model/schema";
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
  campaign: true,
  influencerMatching: true,
  influencerMarket: true,
  commerce: true,
  bigbirdMoney: true,
  purchaserQuestion: true,
};

describe("transformSessionToViewModel", () => {
  it("accepts the stage ADMIN response without nickname and phone", () => {
    // stage `GET /sec` 실제 응답 형태 (nickname·phone 키 없음)
    const session = sessionSchema.parse({
      result: true,
      userIdx: 4643,
      accountIdx: 0,
      authority: "ADMIN",
      username: "admin-dev",
      hasPaymentedCampaign: true,
      service: "client",
      email: "admin-dev@biglinkai.com",
      identifier: "admin-dev",
      userRating: "master",
      threadUserIdx: 5764,
    });
    expect(transformSessionToViewModel(session).displayName).toBe("admin-dev");
  });

  it("grants every menu permission to MASTER and ADMIN", () => {
    expect(transformSessionToViewModel(base).permissions).toEqual(ALL_TRUE);
    expect(
      transformSessionToViewModel({ ...base, authority: "ADMIN" }).permissions,
    ).toEqual(ALL_TRUE);
  });

  it("ignores the permission flags for MASTER", () => {
    const vm = transformSessionToViewModel({
      ...base,
      isBigbirdMoneyAccess: false,
    });
    expect(vm.permissions.bigbirdMoney).toBe(true);
  });

  it("uses the server flags for SUB", () => {
    const vm = transformSessionToViewModel({
      ...base,
      authority: "SUB",
      isBigbirdMoneyAccess: true,
      isInfluencerMatchingAccess: true,
    });
    expect(vm.permissions).toEqual({
      campaign: false,
      influencerMatching: true,
      influencerMarket: false,
      commerce: false,
      bigbirdMoney: true,
      purchaserQuestion: false,
    });
  });

  it("denies a SUB permission the server did not send", () => {
    const vm = transformSessionToViewModel({ ...base, authority: "SUB" });
    expect(Object.values(vm.permissions)).toEqual([
      false,
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
