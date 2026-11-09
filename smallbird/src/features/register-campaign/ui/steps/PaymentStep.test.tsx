import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { CampaignRegisterSlotsContext } from "../../model/slots-context";
import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { PaymentStep } from "./PaymentStep";

import type {
  CampaignAddOn,
  CampaignServiceType,
  CampaignType,
} from "@/entities/campaign";

// 잔액 API는 실제 서버라 훅만 고정값으로 바꿈.
vi.mock("@/entities/bigbird-money", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBigbirdMoneyBalance: () => ({
    balance: { amount: 12_345, isWithdrawable: true },
  }),
}));

beforeEach(() => window.sessionStorage.clear());

// 앞 단계에서 입력했다고 보고 store에 넣는 도구.
function Setup({
  type,
  addOns,
  headcount,
  reward,
}: {
  type: CampaignType;
  addOns: CampaignAddOn[];
  headcount?: number;
  reward?: number;
}) {
  const change = useCampaignRegisterStore((state) => state.changeCampaignType);
  const patchInfo = useCampaignRegisterStore(
    (state) => state.patchCampaignInfo,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);
  const patchConditions = useCampaignRegisterStore(
    (state) => state.patchConditions,
  );
  const setAddOns = useCampaignRegisterStore((state) => state.setAddOns);
  return (
    <button
      onClick={() => {
        change(type);
        patchInfo({ startDate: "2026-11-01" });
        patchProduct({ productPrice: 15_000, quantityPerInfluencer: 2 });
        patchConditions({
          headcount: headcount ?? null,
          rewardPerInfluencer: reward ?? null,
        });
        setAddOns(addOns);
      }}
    >
      준비
    </button>
  );
}

async function renderStep(options: {
  serviceType: CampaignServiceType;
  type: CampaignType;
  addOns: CampaignAddOn[];
  headcount?: number;
  reward?: number;
}) {
  const draft = await createCampaignDraft({
    serviceType: options.serviceType,
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <Setup
          type={options.type}
          addOns={options.addOns}
          headcount={options.headcount}
          reward={options.reward}
        />
        <CampaignRegisterSlotsContext
          value={{ chargeSlot: <p>충전 영역 자리</p> }}
        >
          <PaymentStep />
        </CampaignRegisterSlotsContext>
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "준비" }));
  return user;
}

const card = (name: string) =>
  within(screen.getByRole("heading", { name }).closest("section")!);

describe("8단계 결제 요약 카드", () => {
  it("PICK형은 서비스·캠페인 유형, 제품 제공 리워드, 기간과 AI 포스팅 가이드 금액을 보인다", async () => {
    await renderStep({
      serviceType: "PICK",
      type: "PRODUCT_DELIVERY",
      addOns: ["AI_POSTING_GUIDE"],
    });

    const summary = card("캠페인 요약");
    expect(summary.getByText("PICK형 브랜드형")).toBeVisible();
    expect(summary.getByText("제품발송형")).toBeVisible();
    expect(summary.getByText("제품 제공 (30,000원 상당)")).toBeVisible();
    expect(summary.getByText(/2026.11.01 - 2026.12.01 \(30일\)/)).toBeVisible();
    expect(summary.queryByText("진행 인원")).not.toBeInTheDocument();

    const payment = card("결제 요약");
    expect(payment.getByText("AI 포스팅 가이드")).toBeVisible();
    expect(payment.getAllByText("10,000원")).toHaveLength(2);
    expect(payment.queryByText("리워드")).not.toBeInTheDocument();
  });

  it("부가서비스를 고르지 않으면 부가서비스 행 없이 총액 0원을 보인다", async () => {
    await renderStep({
      serviceType: "PICK",
      type: "PRESS",
      addOns: [],
    });

    const payment = card("결제 요약");
    expect(payment.queryByText("부가서비스 금액")).not.toBeInTheDocument();
    expect(payment.getByText("0원")).toBeVisible();
    expect(
      payment.getByText("결제는 빅버드머니로만 진행됩니다."),
    ).toBeVisible();
  });

  it("모집형 제품발송형은 진행 인원과 인원당 부가서비스·리워드 총액을 보인다", async () => {
    await renderStep({
      serviceType: "RECRUIT",
      type: "PRODUCT_DELIVERY",
      addOns: ["AI_MANUSCRIPT_CONFIRM"],
      headcount: 20,
      reward: 10_000,
    });

    const summary = card("캠페인 요약");
    expect(summary.getByText("모집형 브랜드형")).toBeVisible();
    expect(summary.getByText("20명")).toBeVisible();

    const payment = card("결제 요약");
    expect(payment.getByText("100,000원")).toBeVisible();
    expect(payment.getByText("(건별 5,000원 * 모집인원 20명)")).toBeVisible();
    expect(payment.getByText("리워드")).toBeVisible();
    expect(payment.getAllByText("200,000원")).toHaveLength(1);
    expect(payment.getByText("300,000원")).toBeVisible();
  });

  it("약관 동의 카드는 7단계와 같은 목록이다", async () => {
    await renderStep({
      serviceType: "PICK",
      type: "PRESS",
      addOns: [],
    });

    expect(
      card("약관 동의").getByRole("checkbox", { name: "약관 전체 동의" }),
    ).toBeVisible();
  });

  it("결제 수단은 선택이 고정된 빅버드 머니이고 보유 금액과 충전 영역을 함께 보인다", async () => {
    await renderStep({
      serviceType: "PICK",
      type: "PRESS",
      addOns: [],
    });

    const method = card("결제 수단");
    expect(method.getByRole("radio", { name: /빅버드 머니/ })).toBeChecked();
    expect(method.getByText("필수")).toBeVisible();
    expect(method.getByText("12,345")).toBeVisible();
    expect(method.getByText("충전 영역 자리")).toBeVisible();
  });
});
