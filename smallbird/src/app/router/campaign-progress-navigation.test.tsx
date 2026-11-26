import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useCampaignStatusReturnStore } from "@/entities/campaign";
import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { createFilledDetailResponse } from "./campaign-fixtures";
import { createCampaignServerFake } from "./campaign-server-fake";
import { mockV3Get, renderRoute, resetSession } from "./test-utils";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  identifier: "tester",
  email: "test@example.com",
};

const PAID = {
  policy: {
    agreements: { service: true, privacy: true, operation: true, reward: true },
  },
  payment: { paidAmount: 11000, paidAt: "2026-11-16 10:00:00" },
};

function withType(campaignType: string) {
  return {
    name: "초록숲 비건 스킨케어",
    brandIdx: 2,
    brandName: "초록숲",
    campaignType,
    startDate: "2099-01-01",
    endDate: "2099-01-31",
  };
}

// 20 제품발송형 진행 중 · 21 매장방문형 진행 중 · 22 기자단형 진행 중 · 23 종료 · 24 승인 대기 · 25 공구형 진행 중
beforeEach(() => {
  resetSession(session);
  useCampaignStatusReturnStore.getState().remember("");
  const fake = createCampaignServerFake();
  fake.seed(createFilledDetailResponse(20, { ...PAID, status: "IN_PROGRESS" }));
  fake.seed(
    createFilledDetailResponse(21, {
      ...PAID,
      status: "IN_PROGRESS",
      info: withType("STORE_VISIT"),
      addOns: ["MANUSCRIPT_CONFIRM"],
    }),
  );
  fake.seed(
    createFilledDetailResponse(22, {
      ...PAID,
      status: "IN_PROGRESS",
      info: withType("PRESS"),
    }),
  );
  fake.seed(createFilledDetailResponse(23, { ...PAID, status: "ENDED" }));
  fake.seed(createFilledDetailResponse(24, { ...PAID, status: "REVIEWING" }));
  fake.seed(
    createFilledDetailResponse(25, {
      ...PAID,
      status: "IN_PROGRESS",
      productType: "GROUP_BUY",
    }),
  );
  mockV3Get(fake.get);
  vi.mocked(serverApiV3.post).mockReset();
});

function stepNames() {
  const nav = screen.getByRole("navigation", { name: "진행 단계" });
  return within(nav)
    .getAllByRole("button")
    .map((button) => button.textContent);
}

describe("캠페인 진행", () => {
  it("기본정보를 먼저 보이고, 유형에 맞는 단계로 옮겨 다닌다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute("/campaign/20/progress");

    // MO 헤더와 PC·TAB 제목이 함께 있음(CSS로 하나만 보임).
    expect(
      await screen.findAllByRole("heading", { name: "기본 정보" }),
    ).not.toHaveLength(0);
    expect(stepNames()).toEqual([
      "기본정보",
      "1포스팅 가이드 작성",
      "2크리에이터 탐색",
      "3크리에이터 매칭",
      "4제품 배송 관리",
      "5원고 컨펌",
      "6포스팅 확인",
    ]);

    await user.click(screen.getByRole("button", { name: /크리에이터 탐색/ }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/campaign/20/progress/search",
      ),
    );
    // 주소가 바뀐 뒤 화면이 다시 그려질 때까지 기다림(CI가 느림).
    expect(
      await screen.findByText("준비 중인 기능입니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /크리에이터 탐색/ }),
    ).toHaveAttribute("aria-current", "step");
  });

  it("매장방문형은 매장 방문 단계가 있다", async () => {
    await renderRoute("/campaign/21/progress");

    await screen.findAllByRole("heading", { name: "기본 정보" });
    expect(stepNames()).toEqual([
      "기본정보",
      "1포스팅 가이드 작성",
      "2크리에이터 탐색",
      "3크리에이터 매칭",
      "4매장 방문 관리",
      "5원고 컨펌",
      "6포스팅 확인",
    ]);
  });

  it("기자단형은 4단계가 없고, 유형에 없는 단계 주소는 기본정보로 보낸다", async () => {
    const router = await renderRoute("/campaign/22/progress/delivery");

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/campaign/22/progress"),
    );
    expect(stepNames()).toEqual([
      "기본정보",
      "1포스팅 가이드 작성",
      "2크리에이터 탐색",
      "3크리에이터 매칭",
      "4원고 컨펌",
      "5포스팅 확인",
    ]);
  });

  it("종료된 캠페인도 모든 단계를 열고, 맨 아래에 캠페인 결과가 있다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute("/campaign/23/progress/guide");

    expect(
      await screen.findByRole("button", { name: /포스팅 가이드 작성/ }),
    ).toHaveAttribute("aria-current", "step");
    expect(router.state.location.pathname).toBe("/campaign/23/progress/guide");
    expect(stepNames()).toContain("기본정보");

    await user.click(screen.getByRole("button", { name: "캠페인 결과" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/campaign/23/progress/result",
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "캠페인 결과" }),
      ).toHaveAttribute("aria-current", "page"),
    );
  });

  it('헤더 "<"는 들어온 길과 상관없이 기억한 쿼리의 캠페인 현황으로 간다', async () => {
    const user = userEvent.setup();
    useCampaignStatusReturnStore.getState().remember("?tab=active");
    const router = await renderRoute([
      ROUTES.home,
      "/campaign/20/progress/guide",
    ]);

    await screen.findByRole("button", { name: /포스팅 가이드 작성/ });
    await user.click(screen.getByRole("button", { name: "뒤로가기" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaign),
    );
    expect(router.state.location.search).toBe("?tab=active");
  });

  it.each([
    ["승인 대기", 24],
    ["공구형", 25],
  ])("%s 캠페인은 등록 내역으로 보낸다", async (_label, campaignIdx) => {
    const router = await renderRoute(`/campaign/${campaignIdx}/progress`);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/campaign/${campaignIdx}`),
    );
  });
});
