import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import {
  CAMPAIGN_TOPICS,
  createCampaignDraft,
  saveCampaignDraft,
} from "@/entities/campaign";
import { ApiError } from "@/shared/api";

import { CampaignRegisterProvider } from "./CampaignRegisterProvider";
import { CampaignRegisterWizard } from "./CampaignRegisterWizard";

import type { CampaignAddOn, CampaignDraft } from "@/entities/campaign";

const mocks = vi.hoisted(() => ({
  balance: { amount: 0 },
  pay: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// 잔액 API와 결제 API는 실제 서버라 바꿔 둠. 결제 호출 인자와 결과만 확인함.
vi.mock("@/entities/bigbird-money", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBigbirdMoneyBalance: () => ({
    balance: { amount: mocks.balance.amount, isWithdrawable: true },
    mutate: async () => ({
      amount: mocks.balance.amount,
      isWithdrawable: true,
    }),
  }),
}));
vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  payCampaign: mocks.pay,
}));

const file = (fileId: string) => ({
  fileId,
  url: `blob:${fileId}`,
  mediaType: "IMAGE" as const,
  durationSec: null,
  thumbnailUrl: null,
});

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

// 모든 단계 검사를 통과하는 PICK형 기자단형 초안을 서버(목)에 저장해 둠.
async function createCompleteDraft(addOns: CampaignAddOn[]) {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  const complete: CampaignDraft = {
    ...draft,
    campaignInfo: {
      name: "봄 캠페인",
      campaignType: "PRESS",
      brandIdx: 1,
      startDate: "2030-01-01",
      endDate: "2030-01-31",
    },
    influencer: {
      platform: "INSTAGRAM",
      gender: "ALL",
      ageGroups: ["AGE_20S"],
      topics: [CAMPAIGN_TOPICS[0]],
    },
    addOns,
    intro: {
      mode: "MANUAL",
      sourceUrl: null,
      mainImage: file("main"),
      media: [file("m1")],
      description: "설명",
      notice: "유의사항",
      hashtags: ["여름"],
      aiJob: null,
    },
    conditions: {
      ...draft.conditions,
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
  };
  const saved = await saveCampaignDraft(complete);
  return { ...complete, version: saved.version };
}

async function renderPayStep(addOns: CampaignAddOn[]) {
  const draft = await createCompleteDraft(addOns);
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter initialEntries={["/?step=payment"]}>
        <CampaignRegisterProvider campaignId={draft.campaignIdx}>
          <CampaignRegisterWizard />
          <Location />
        </CampaignRegisterProvider>
      </MemoryRouter>
    </SWRConfig>,
  );
  const user = userEvent.setup();
  const payButton = await screen.findByRole("button", { name: "결제하기" });
  return { draft, user, payButton };
}

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.balance.amount = 0;
  mocks.pay.mockReset().mockResolvedValue({
    status: "REVIEWING",
    paidAmount: 0,
    paidAt: "2030-01-01 10:00:00",
    balance: 0,
  });
  vi.mocked(toast.error).mockClear();
});

describe("8단계 결제하기", () => {
  it("0원이어도 결제하기가 승인 요청이라 잔액 검사 없이 결제를 요청하고, 완료 확인 뒤 등록 내역으로 교체 이동한다", async () => {
    const { draft, user, payButton } = await renderPayStep([]);

    await user.click(payButton);

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("결제 완료");
    expect(mocks.pay).toHaveBeenCalledWith(draft.campaignIdx, 0);

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/campaign/${draft.campaignIdx}`,
    );
  });

  it("잔액이 총액보다 적으면 결제 금액 부족 알럿만 띄우고 결제하지 않는다", async () => {
    mocks.balance.amount = 9_999;
    const { user, payButton } = await renderPayStep(["AI_POSTING_GUIDE"]);

    await user.click(payButton);

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("결제 금액 부족");
    expect(mocks.pay).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.getByTestId("location")).toHaveTextContent("?step=payment");
  });

  it("잔액이 충분하면 총액으로 결제를 요청한다", async () => {
    mocks.balance.amount = 10_000;
    const { draft, user, payButton } = await renderPayStep([
      "AI_POSTING_GUIDE",
    ]);

    await user.click(payButton);

    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "결제 완료",
    );
    expect(mocks.pay).toHaveBeenCalledWith(draft.campaignIdx, 10_000);
  });

  it("서버가 금액이 달라졌다고 거절하면 그 안내를 토스트로 띄우고 이동하지 않는다", async () => {
    mocks.pay.mockRejectedValue(
      new ApiError(409, { result: false, reason: "AMOUNT_CHANGED" }),
    );
    const { user, payButton } = await renderPayStep([]);

    await user.click(payButton);

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "결제 금액이 변경되었습니다. 결제 요약을 확인한 뒤 다시 결제해 주세요.",
      ),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("?step=payment");
  });

  it("그 밖의 결제 실패는 실패 토스트를 띄운다", async () => {
    mocks.pay.mockRejectedValue(new Error("network"));
    const { user, payButton } = await renderPayStep([]);

    await user.click(payButton);

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "결제에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
  });
});
