import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createCampaign, fetchCampaignDetail } from "@/entities/campaign";
import { ROUTES } from "@/shared/config";

import { renderRoute, resetSession } from "./test-utils";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), post: vi.fn() },
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

// 목 저장소 시드(entities/campaign mock/campaign-seeds): 14개, 3 작성 완료 데모 · 6 승인 검토중 · 14 모집형 등록 중
const SEED_COUNT = 14;

function readMockCampaignCount() {
  const raw = window.sessionStorage.getItem("bigbird:mock:campaign-db");
  const db = JSON.parse(raw ?? "{}") as { campaigns?: unknown[] };
  return db.campaigns?.length ?? 0;
}

beforeEach(() => {
  window.sessionStorage.clear();
  resetSession(session);
});

describe("캠페인 등록 진입", () => {
  it("PICK형으로 들어오면 캠페인을 한 번 만들고 1단계 작성 주소로 바꾼다", async () => {
    const router = await renderRoute(`${ROUTES.campaignRegister}?type=pick`);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/${SEED_COUNT + 1}`,
      ),
    );
    expect(router.state.location.search).toBe("?step=campaign-info");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(
      await screen.findByRole("heading", { name: "캠페인 등록" }),
    ).toBeInTheDocument();
    expect(readMockCampaignCount()).toBe(SEED_COUNT + 1);
  });

  it("모집형은 준비 중 화면이다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}?type=recruit`);

    expect(
      await screen.findByText("준비 중인 기능입니다."),
    ).toBeInTheDocument();
    expect(readMockCampaignCount()).toBe(0);
  });

  it("type이 없거나 잘못되면 not-found다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}?type=group`);

    expect(
      await screen.findByText("페이지를 찾을 수 없습니다"),
    ).toBeInTheDocument();
  });
});

describe("작성 주소의 상태별 진입", () => {
  it.each([
    ["승인 검토중", 6],
    ["작성을 마친 데모", 3],
  ])("%s 캠페인은 등록 내역 주소로 보낸다", async (_label, campaignIdx) => {
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}`,
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/campaign/${campaignIdx}`),
    );
  });

  it("등록 중인 모집형 캠페인은 준비 중 화면이다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}/14`);

    expect(
      await screen.findByText("준비 중인 기능입니다."),
    ).toBeInTheDocument();
  });

  it.each(["9999", "abc"])(
    "없는 캠페인(%s)은 not-found다",
    async (campaignIdx) => {
      await renderRoute(`${ROUTES.campaignRegister}/${campaignIdx}`);

      expect(
        await screen.findByText("페이지를 찾을 수 없습니다"),
      ).toBeInTheDocument();
    },
  );
});

// 단계 잠금·첫 미완 단계·사이드바 상태 규칙은 step-status.test.ts, 저장 대기열은 draft-saver.test.ts가 맡음.
// 여기서는 화면을 떠나는 이동(방문 기록) 하나만 봄. 방문 기록은 원래 E2E 대상이지만 등록 화면은 개발 서버 목에서만 열려
// 빌드로 도는 E2E에서 열 수 없어, API 연결 뒤 E2E로 옮김(스펙 §9).
describe("등록 마법사 골격", () => {
  it("입력을 바꾼 채 앱 안에서 떠나면 먼저 저장하고 한 번만 이동한다", async () => {
    const user = userEvent.setup();
    const { campaignIdx } = await createCampaign({
      serviceType: "PICK",
      productType: "BRAND",
      demo: false,
    });
    const router = await renderRoute([
      ROUTES.campaign,
      `${ROUTES.campaignRegister}/${campaignIdx}?step=campaign-info`,
    ]);
    await user.type(
      await screen.findByRole("textbox", { name: /캠페인명/ }),
      "떠나기 전 저장",
    );

    await router.navigate(-1);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaign),
    );
    const { draft } = await fetchCampaignDetail(campaignIdx);
    expect(draft.info.name).toBe("떠나기 전 저장");
  });
});
