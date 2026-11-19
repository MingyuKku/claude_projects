import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createEmptyDraft } from "@/entities/campaign";

import { RegisterWizardProvider } from "../../RegisterWizardProvider";
import { IntroStep } from "./IntroStep";

import type {
  CampaignDetail,
  CampaignDraft,
  CampaignPlatform,
} from "@/entities/campaign";

function createDetail(patch?: (draft: CampaignDraft) => void): CampaignDetail {
  const draft = createEmptyDraft();
  patch?.(draft);
  return {
    campaignIdx: 15,
    campaignCode: "PB-00000000000015",
    serviceType: "PICK",
    productType: "BRAND",
    stage: "DRAFT",
    rawStatus: "DRAFT",
    isDemo: false,
    isDemoCompleted: false,
    rejectReason: null,
    brand: null,
    rawCampaignType: null,
    endDate: null,
    draft,
    payment: null,
  };
}

function renderManualIntro(platform: CampaignPlatform | null) {
  render(
    <RegisterWizardProvider
      detail={createDetail((draft) => {
        draft.creator.platform = platform;
        draft.intro.description = "기존 설명";
      })}
    >
      <IntroStep />
    </RegisterWizardProvider>,
  );
}

describe("IntroStep", () => {
  it("입력값이 없으면 AI 작성으로 열고 URL을 넣어야 AI 생성을 누를 수 있다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <IntroStep />
      </RegisterWizardProvider>,
    );

    expect(
      screen.getByRole("radio", { name: /AI 캠페인 소개서 작성/ }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: "AI 생성" })).toBeDisabled();

    await user.type(
      screen.getByLabelText(/상품\/서비스 URL/),
      "https://example.com",
    );

    expect(screen.getByRole("button", { name: "AI 생성" })).toBeEnabled();
  });

  it("방식을 바꿔도 입력값을 지우지 않는다", async () => {
    const user = userEvent.setup();
    renderManualIntro("INSTAGRAM");

    expect(screen.getByRole("radio", { name: /직접 작성하기/ })).toBeChecked();
    await user.click(
      screen.getByRole("radio", { name: /AI 캠페인 소개서 작성/ }),
    );
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));

    expect(screen.getByLabelText(/캠페인 설명/)).toHaveValue("기존 설명");
  });

  it("블로그·유튜브는 제목·본문 해시태그 두 칸, 그 밖은 한 칸이다", () => {
    renderManualIntro("NAVER_BLOG");

    expect(screen.getByLabelText(/제목 필수 해시태그/)).toBeInTheDocument();
    expect(screen.getByLabelText(/본문 필수 해시태그/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/필수 해시태그\(키워드\)/),
    ).not.toBeInTheDocument();
  });

  it("해시태그는 Enter로 칩을 더하고, 같은 값은 넣지 않으며, ×로 지운다", async () => {
    const user = userEvent.setup();
    renderManualIntro("INSTAGRAM");
    const input = screen.getByLabelText(/필수 해시태그\(키워드\)/);

    await user.type(input, "#협찬{Enter}체험단{Enter}협찬{Enter}");
    const chips = screen.getByRole("list");

    expect(
      within(chips)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["협찬", "체험단"]);

    await user.click(screen.getByRole("button", { name: "협찬 삭제" }));

    expect(
      within(chips)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["체험단"]);
  });
});
