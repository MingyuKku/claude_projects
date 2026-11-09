import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";

import {
  createCampaignDraft,
  payCampaign,
  saveCampaignDraft,
  testReviewCampaign,
} from "@/entities/campaign";

import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { ConditionsStep } from "./ConditionsStep";

beforeEach(() => window.sessionStorage.clear());

// 모집형 기자단형(결제 0원)을 결제한 뒤 반려된 캠페인을 서버(목)에 만들어 수정 모드로 엶.
async function renderRejectedConditions() {
  const draft = await createCampaignDraft({
    serviceType: "RECRUIT",
    productType: "BRAND",
  });
  await saveCampaignDraft({
    ...draft,
    campaignInfo: { ...draft.campaignInfo, campaignType: "PRESS" },
    conditions: {
      ...draft.conditions,
      headcount: 3,
      postingPeriodMonths: 3,
      secondaryCopyright: true,
    },
    policy: {
      agreements: {
        service: true,
        privacy: true,
        operation: true,
        reward: true,
      },
    },
  });
  await payCampaign(draft.campaignIdx, 0);
  await testReviewCampaign(draft.campaignIdx, {
    result: "REJECT",
    rejections: [{ section: "CONDITIONS", reason: "사유" }],
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <ConditionsStep />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByRole("group", { name: /포스팅 유지기간/ });
}

describe("수정 모드의 6단계 진행 조건", () => {
  it("인원은 읽기 전용이고 유지기간·2차 저작권은 그대로 고칠 수 있다", async () => {
    await renderRejectedConditions();

    expect(
      screen.getByText("결제 금액에 영향을 주는 값이라 수정할 수 없습니다."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "인원 늘리기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "인원 줄이기" })).toBeDisabled();
    expect(screen.getByText("3")).toBeVisible();

    expect(screen.getByRole("radio", { name: "6개월" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "사용" })).toBeEnabled();
  });
});
