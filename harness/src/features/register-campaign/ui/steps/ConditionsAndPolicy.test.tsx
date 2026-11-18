import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { createEmptyDraft } from "@/entities/campaign";

import { RegisterWizardProvider } from "../RegisterWizardProvider";
import { ConditionsStep } from "./conditions/ConditionsStep";
import { PolicyStep } from "./policy/PolicyStep";

import type { CampaignDetail, CampaignDraft } from "@/entities/campaign";
import type { ReactNode } from "react";

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

function renderStep(step: ReactNode, detail = createDetail()) {
  render(
    <MemoryRouter>
      <RegisterWizardProvider detail={detail}>{step}</RegisterWizardProvider>
    </MemoryRouter>,
  );
}

describe("ConditionsStep", () => {
  it("직접 입력은 1~999개월만 받고, 벗어나면 입력 아래에 오류를 보인다", async () => {
    const user = userEvent.setup();
    renderStep(<ConditionsStep />);

    await user.click(screen.getByRole("radio", { name: "직접 입력" }));
    const input = screen.getByRole("textbox", { name: "포스팅 유지기간" });
    await user.type(input, "1000");

    expect(input).toHaveAccessibleDescription(
      "1~999개월 사이로 입력해 주세요.",
    );

    await user.clear(input);
    await user.type(input, "24");

    expect(
      screen.queryByText("1~999개월 사이로 입력해 주세요."),
    ).not.toBeInTheDocument();
  });

  it("고정 선택지 밖의 값이면 직접 입력으로 연다", () => {
    renderStep(
      <ConditionsStep />,
      createDetail((draft) => {
        draft.conditions.postingPeriodMonths = 24;
      }),
    );

    expect(screen.getByRole("radio", { name: "직접 입력" })).toBeChecked();
    expect(
      screen.getByRole("textbox", { name: "포스팅 유지기간" }),
    ).toHaveValue("24");
  });
});

describe("PolicyStep", () => {
  it("약관 전체 동의는 4개를 한꺼번에 켜고 끈다", async () => {
    const user = userEvent.setup();
    renderStep(<PolicyStep />);

    await user.click(screen.getByRole("checkbox", { name: "약관 전체 동의" }));

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeChecked();
    }

    await user.click(screen.getByRole("checkbox", { name: "약관 전체 동의" }));

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).not.toBeChecked();
    }
  });

  it("4개를 하나씩 모두 켜면 전체 동의도 켜진다", async () => {
    const user = userEvent.setup();
    renderStep(<PolicyStep />);

    for (const name of [
      "서비스 이용약관 동의",
      "개인정보 처리방침 동의",
      "캠페인 운영 정책 동의",
      "리워드 및 결제 관련 정책 동의",
    ]) {
      await user.click(screen.getByRole("checkbox", { name }));
    }

    expect(
      screen.getByRole("checkbox", { name: "약관 전체 동의" }),
    ).toBeChecked();
  });

  it("전문이 있는 서비스 이용약관·개인정보 처리방침에만 전문 보기가 있다", () => {
    renderStep(<PolicyStep />);

    expect(
      screen.getByRole("button", { name: "서비스 이용약관" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "개인정보 처리방침" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
