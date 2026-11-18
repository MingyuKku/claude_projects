import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { createEmptyDraft } from "@/entities/campaign";

import { useRegisterWizardStore } from "../../../model/wizard-context";
import { RegisterWizardProvider } from "../../RegisterWizardProvider";
import { CampaignInfoStep } from "./CampaignInfoStep";

import type { CampaignDetail, CampaignDraft } from "@/entities/campaign";

// PC·TAB(768 이상)으로 그림. 브랜드 메뉴가 팝오버로 열림.
beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 768px)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => vi.unstubAllGlobals());

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
    rawCampaignType: draft.info.campaignType,
    endDate: null,
    draft,
    payment: null,
  };
}

/** 화면 밖 store 값(2단계 이후 입력)을 확인하려고 보이는 문자로 꺼냄. */
function ProductNameProbe() {
  const productName = useRegisterWizardStore(
    (state) => state.draft.product.productName,
  );
  return <output aria-label="제품명 값">{productName}</output>;
}

function renderStep(detail: CampaignDetail) {
  return render(
    <MemoryRouter>
      <SWRConfig value={{ provider: () => new Map() }}>
        <RegisterWizardProvider detail={detail}>
          <CampaignInfoStep />
          <ProductNameProbe />
        </RegisterWizardProvider>
      </SWRConfig>
    </MemoryRouter>,
  );
}

describe("CampaignInfoStep", () => {
  it("캠페인 코드를 읽기 전용으로 보이고 캠페인명을 입력받는다", async () => {
    const user = userEvent.setup();
    renderStep(createDetail());

    expect(screen.getByText("PB-00000000000015")).toBeInTheDocument();
    const name = screen.getByRole("textbox", { name: /캠페인명/ });
    await user.type(name, "봄 체험단");
    expect(name).toHaveValue("봄 체험단");
  });

  it("2~7단계에 입력이 없으면 유형을 바로 바꾸고, 다시 눌러도 해제하지 않는다", async () => {
    const user = userEvent.setup();
    renderStep(createDetail());
    const group = screen.getByRole("radiogroup", { name: "캠페인 유형" });

    await user.click(within(group).getByRole("radio", { name: "기자단형" }));
    await user.click(within(group).getByRole("radio", { name: "기자단형" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      within(group).getByRole("radio", { name: "기자단형" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("2~7단계에 입력이 있으면 확인 알럿을 띄우고, 취소하면 그대로, 변경하면 2~7단계를 비운다", async () => {
    const user = userEvent.setup();
    renderStep(
      createDetail((draft) => {
        draft.info.campaignType = "PRODUCT_DELIVERY";
        draft.product.productName = "앰플";
      }),
    );
    const group = screen.getByRole("radiogroup", { name: "캠페인 유형" });

    await user.click(within(group).getByRole("radio", { name: "기자단형" }));
    const alert = screen.getByRole("alertdialog", { name: "캠페인 유형 변경" });
    await user.click(within(alert).getByRole("button", { name: "취소" }));
    expect(
      within(group).getByRole("radio", { name: "제품발송형" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("status", { name: "제품명 값" })).toHaveTextContent(
      "앰플",
    );

    await user.click(within(group).getByRole("radio", { name: "기자단형" }));
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      within(group).getByRole("radio", { name: "기자단형" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("status", { name: "제품명 값" }),
    ).toBeEmptyDOMElement();
  });

  it("브랜드를 고르면 입력에 보인다", async () => {
    const user = userEvent.setup();
    renderStep(createDetail());

    await user.click(screen.getByRole("button", { name: /브랜드명/ }));
    await user.click(await screen.findByRole("option", { name: "초록숲" }));

    expect(screen.getByRole("button", { name: /브랜드명/ })).toHaveTextContent(
      "초록숲",
    );
  });

  it("시작일을 골라도 라벨과 한 칸이 그대로고 종료일 칸은 없다", () => {
    renderStep(
      createDetail((draft) => {
        draft.info.startDate = "2026-12-01";
      }),
    );

    expect(screen.getByText("캠페인 희망 시작 일자")).toBeInTheDocument();
    expect(screen.queryByText("캠페인 기간")).not.toBeInTheDocument();
    expect(screen.queryByText("2026.12.31")).not.toBeInTheDocument();
  });

  it("시작일이 없으면 희망 시작 일자 한 칸이다", () => {
    renderStep(createDetail());

    expect(screen.getByText("캠페인 희망 시작 일자")).toBeInTheDocument();
    expect(
      screen.getByText("종료 날짜는 자동으로 30일 후로 세팅됩니다."),
    ).toBeInTheDocument();
  });
});
