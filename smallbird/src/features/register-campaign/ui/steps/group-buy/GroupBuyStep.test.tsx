import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createEmptyDraft } from "@/entities/campaign";

import { useRegisterWizardStore } from "../../../model/wizard-context";
import { RegisterWizardProvider } from "../../RegisterWizardProvider";
import { GroupBuyStep } from "./GroupBuyStep";

import type { CampaignDetail } from "@/entities/campaign";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useProductCategories: () => ({
    categories: [
      {
        idx: 8,
        name: "여행/문화",
        children: [
          { idx: 35, name: "서적" },
          { idx: 36, name: "호텔/펜션 예약" },
        ],
      },
      { idx: 5, name: "식품", children: [{ idx: 26, name: "가공식품" }] },
    ],
    error: undefined,
    isLoading: false,
  }),
}));

// PC·TAB(768 이상)으로 그림. 선택 칸이 팝오버로 열림.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 768px)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => vi.unstubAllGlobals());

function createDetail(): CampaignDetail {
  const draft = createEmptyDraft();
  draft.product.productName = "신라호텔 숙박권";
  draft.product.productPrice = 30000;
  return {
    campaignIdx: 21,
    campaignCode: "PO-00000000000021",
    serviceType: "PICK",
    productType: "GROUP_BUY",
    stage: "DRAFT",
    rawStatus: "DRAFT",
    isDemo: false,
    isDemoCompleted: false,
    rejectReason: null,
    brand: null,
    rawCampaignType: "PRODUCT_DELIVERY",
    endDate: null,
    draft,
    payment: null,
  };
}

function GroupBuyProbe() {
  const groupBuy = useRegisterWizardStore((state) => state.draft.groupBuy);
  return (
    <output aria-label="공동구매 조건 값">{JSON.stringify(groupBuy)}</output>
  );
}

function renderStep() {
  return render(
    <RegisterWizardProvider detail={createDetail()}>
      <GroupBuyStep />
      <GroupBuyProbe />
    </RegisterWizardProvider>,
  );
}

describe("GroupBuyStep", () => {
  it("제품명과 권장소비자가는 협찬 제품 정보와 별개로 직접 입력한다", async () => {
    const user = userEvent.setup();
    renderStep();

    const productName = screen.getByLabelText(/공동구매 제품명/);
    const recommendedPrice = screen.getByLabelText(/권장소비자가/);
    expect(productName).toHaveValue("");
    expect(recommendedPrice).toHaveValue("");

    await user.type(productName, "신라호텔 1박");
    await user.type(recommendedPrice, "6a0000");

    expect(productName).toHaveValue("신라호텔 1박");
    expect(recommendedPrice).toHaveValue("60,000");
    expect(screen.getByLabelText("공동구매 조건 값")).toHaveTextContent(
      '"productName":"신라호텔 1박"',
    );
    expect(screen.getByLabelText("공동구매 조건 값")).toHaveTextContent(
      '"recommendedPrice":60000',
    );
  });

  it("공동구매가 아래에 네이버 쇼핑 기준 안내 두 줄을 보여 준다", () => {
    renderStep();

    expect(
      screen.getByText(
        "네이버 쇼핑 검색 기준 최저가보다 최소 10% 이상 저렴하게 설정하는 것을 권장합니다.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "공동구매가는 공동구매 진행 시점의 네이버 쇼핑 검색 최저가에 따라 변경될 수 있습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("대분류를 고르기 전에는 중분류를 고를 수 없다", () => {
    renderStep();

    expect(screen.getByLabelText(/공동구매 상품 중분류/)).toBeDisabled();
  });

  it("고른 대분류에 딸린 중분류만 보이고, 대분류를 바꾸면 중분류를 비운다", async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByLabelText(/공동구매 상품 대분류/));
    await user.click(screen.getByRole("option", { name: "여행/문화" }));
    await user.click(screen.getByLabelText(/공동구매 상품 중분류/));
    expect(screen.queryByRole("option", { name: "가공식품" })).toBeNull();
    await user.click(screen.getByRole("option", { name: "호텔/펜션 예약" }));
    expect(screen.getByLabelText("공동구매 조건 값")).toHaveTextContent(
      '"categoryIdx":8,"middleCategoryIdx":36',
    );

    await user.click(screen.getByLabelText(/공동구매 상품 대분류/));
    await user.click(screen.getByRole("option", { name: "식품" }));
    expect(screen.getByLabelText("공동구매 조건 값")).toHaveTextContent(
      '"categoryIdx":5,"middleCategoryIdx":null',
    );
  });

  it("공동구매가는 숫자만 받아 천 단위로 보여 준다", async () => {
    const user = userEvent.setup();
    renderStep();

    await user.type(screen.getByLabelText(/공동구매가/), "45a000");

    expect(screen.getByLabelText(/공동구매가/)).toHaveValue("45,000");
    expect(screen.getByLabelText("공동구매 조건 값")).toHaveTextContent(
      '"price":45000',
    );
  });
});
