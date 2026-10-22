import { getCampaignsState } from "./campaigns-state";

describe("getCampaignsState", () => {
  it("다시 불러오기가 실패해도 받아 둔 목록이 있으면 ready", () => {
    expect(
      getCampaignsState({ hasData: true, isLoading: false, isError: true }),
    ).toBe("ready");
  });

  it("목록 없이 실패하면 error, 처음 불러오는 중이면 loading", () => {
    expect(
      getCampaignsState({ hasData: false, isLoading: false, isError: true }),
    ).toBe("error");
    expect(
      getCampaignsState({ hasData: false, isLoading: true, isError: false }),
    ).toBe("loading");
  });
});
