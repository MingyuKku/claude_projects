import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { createEmptyDraft } from "@/entities/campaign";
import { serverApiV3 } from "@/shared/api";

import { useRegisterWizardStore } from "../../model/wizard-context";
import { RegisterWizardProvider } from "../RegisterWizardProvider";
import { LoadPreviousPanel } from "./LoadPreviousPanel";

import type { CampaignDetail } from "@/entities/campaign";
import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), post: vi.fn() },
}));

const CURRENT_IDX = 15;

// 서버의 이전 캠페인 목록(A-2)과 상세(A-3), 복사(A-8)를 흉내 냄. 모집형 캠페인은 목록에 있어도 같은 서비스만 요청하므로 나오지 않음.
const SOURCES = [
  { campaignIdx: 11, name: "초록숲 비건 스킨케어", serviceType: "PICK" },
  { campaignIdx: 12, name: "빅링크 헤어 에센스 리뷰", serviceType: "PICK" },
  { campaignIdx: 13, name: "비글로우 선케어 캠페인", serviceType: "RECRUIT" },
];

function listItem(source: (typeof SOURCES)[number]) {
  return {
    campaignIdx: source.campaignIdx,
    campaignCode: `PB-${source.campaignIdx}`,
    serviceType: source.serviceType,
    productType: "BRAND",
    status: "DRAFT",
    name: source.name,
    campaignType: "PRODUCT_DELIVERY",
    platform: "INSTAGRAM",
    createdDate: "2026-11-16 10:00:00",
  };
}

function detailResponse(name: string | null) {
  return {
    campaignIdx: CURRENT_IDX,
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    demo: false,
    demoCompleted: false,
    info: {
      campaignCode: "PB-15",
      name,
      brandIdx: null,
      brandName: null,
      brandLogoUrl: null,
      campaignType: "PRODUCT_DELIVERY",
      startDate: null,
      endDate: null,
    },
    product: {
      productName: null,
      quantityPerInfluencer: null,
      productPrice: null,
      returnRequired: false,
      returnAddress: null,
      returnShippingFee: null,
      returnContact: null,
      rental: false,
      rentalReturnAddress: null,
      rentalReturnShippingFee: null,
      rentalReturnContact: null,
      storeName: null,
      storeAddress: null,
      visitCouponCode: null,
      visitBenefit: null,
    },
    influencer: { platform: null, gender: null, ageGroups: [], topics: [] },
    groupBuyingConditions: null,
    addOns: [],
    intro: {
      mainImage: null,
      detailMedia: [],
      description: null,
      notice: null,
      titleHashtags: [],
      contentHashtags: [],
    },
    conditions: {
      headcount: null,
      rewardPerInfluencer: null,
      postingPeriodMonths: null,
      secondaryCopyright: null,
    },
    policy: null,
    payment: null,
  };
}

let copiedName: string | null;

// 표(PC 1440 이상)로 그림.
beforeEach(() => {
  copiedName = null;
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockImplementation((async (
      path: string,
      config?: { params?: Record<string, unknown> },
    ) => {
      if (path === "/campaign") {
        const params = config?.params ?? {};
        const keyword = String(params.keyword ?? "");
        const list = SOURCES.filter(
          (source) =>
            source.serviceType === params.serviceType &&
            source.name.includes(keyword),
        ).map(listItem);
        return { list, count: list.length, currentPage: 1, entrySize: 20 };
      }
      if (path === `/campaign/${CURRENT_IDX}`)
        return detailResponse(copiedName);
      throw new Error(`unmocked GET ${path}`);
    }) as never);
  vi.mocked(serverApiV3.post)
    .mockReset()
    .mockImplementation((async (
      path: string,
      body: { sourceCampaignIdx: number },
    ) => {
      if (path !== `/campaign/${CURRENT_IDX}/copy`) {
        throw new Error(`unmocked POST ${path}`);
      }
      copiedName =
        SOURCES.find((source) => source.campaignIdx === body.sourceCampaignIdx)
          ?.name ?? null;
    }) as never);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 1440px)" || query === "(min-width: 768px)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => vi.unstubAllGlobals());

function NameProbe() {
  const name = useRegisterWizardStore((state) => state.draft.info.name);
  return <output aria-label="캠페인명 값">{name}</output>;
}

function createDetail(draft = createEmptyDraft()): CampaignDetail {
  return {
    campaignIdx: CURRENT_IDX,
    campaignCode: "PB-15",
    serviceType: "PICK",
    productType: "BRAND",
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

function renderPanel({ hasInput }: { hasInput: boolean }) {
  const draft = createEmptyDraft();
  if (hasInput) draft.info.name = "작성 중";
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <RegisterWizardProvider detail={createDetail(draft)}>
            <LoadPreviousPanel />
            <NameProbe />
          </RegisterWizardProvider>
        ),
      },
    ],
    { initialEntries: ["/?panel=load-previous"] },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return { router };
}

describe("LoadPreviousPanel", () => {
  it("같은 서비스 유형 캠페인만 보이고 1개만 고른다", async () => {
    const user = userEvent.setup();
    renderPanel({ hasInput: false });

    const vegan = await screen.findByRole("checkbox", {
      name: "초록숲 비건 스킨케어",
    });
    // 모집형 캠페인(비글로우 선케어 캠페인)은 나오지 않음.
    expect(
      screen.queryByText("비글로우 선케어 캠페인"),
    ).not.toBeInTheDocument();
    const load = screen.getByRole("button", { name: "캠페인 불러오기" });
    expect(load).toBeDisabled();

    await user.click(vegan);
    await user.click(
      screen.getByRole("checkbox", { name: "빅링크 헤어 에센스 리뷰" }),
    );

    expect(vegan).not.toBeChecked();
    expect(load).toBeEnabled();
  });

  it("검색 결과가 없으면 검색어를 넣은 빈 상태를 보인다", async () => {
    const user = userEvent.setup();
    renderPanel({ hasInput: false });

    await user.type(
      await screen.findByRole("searchbox", { name: "캠페인 검색" }),
      "없는 캠페인{Enter}",
    );

    expect(
      await screen.findByText("‘없는 캠페인’에 대한 검색 결과가 없습니다."),
    ).toBeInTheDocument();
  });

  it("입력한 값이 있으면 덮어쓰기 알럿 뒤 불러와 초안을 다시 채우고 닫는다", async () => {
    const user = userEvent.setup();
    const { router } = renderPanel({ hasInput: true });

    await user.click(
      await screen.findByRole("checkbox", { name: "초록숲 비건 스킨케어" }),
    );
    await user.click(screen.getByRole("button", { name: "캠페인 불러오기" }));
    const alert = screen.getByRole("alertdialog", { name: "캠페인 불러오기" });
    await user.click(within(alert).getByRole("button", { name: "불러오기" }));

    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "캠페인명 값" }),
      ).toHaveTextContent("초록숲 비건 스킨케어"),
    );
    expect(router.state.location.search).toBe("");
  });
});
