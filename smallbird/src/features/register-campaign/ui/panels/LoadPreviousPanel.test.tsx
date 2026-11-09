import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import {
  createCampaignDraft,
  type copyPreviousCampaign,
} from "@/entities/campaign";
import { ApiError } from "@/shared/api";

import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { CampaignRegisterWizard } from "../CampaignRegisterWizard";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const copyFailure = vi.hoisted(() => ({ error: null as Error | null }));

vi.mock("sonner", () => ({ toast }));
// 복사만 실패시킬 수 있게 감쌈. 평소에는 목 API를 그대로 부름.
vi.mock("@/entities/campaign", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const copy = actual.copyPreviousCampaign as typeof copyPreviousCampaign;
  return {
    ...actual,
    copyPreviousCampaign: (...args: Parameters<typeof copyPreviousCampaign>) =>
      copyFailure.error ? Promise.reject(copyFailure.error) : copy(...args),
  };
});

// jsdom에는 Radix·vaul이 쓰는 브라우저 API가 없음.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

// 화면 폭을 흉내 냄: PC(1440 이상)는 드로어 + 표, 그 아래는 서브 화면 + 카드.
function stubWidth(isDesktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches:
        query === "(min-width: 768px)" ||
        (query === "(min-width: 1440px)" && isDesktop),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  copyFailure.error = null;
  toast.error.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function renderPanel(
  options: { serviceType?: "PICK" | "RECRUIT"; isDesktop?: boolean } = {},
) {
  stubWidth(options.isDesktop ?? false);
  const draft = await createCampaignDraft({
    serviceType: options.serviceType ?? "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter
        initialEntries={["/?step=campaign-info&panel=load-previous"]}
      >
        <CampaignRegisterProvider campaignId={draft.campaignIdx}>
          <CampaignRegisterWizard />
        </CampaignRegisterProvider>
      </MemoryRouter>
    </SWRConfig>,
  );
  // PC 드로어는 접근성용 시트 제목이 따로 있어 제목이 둘일 수 있음.
  await screen.findAllByRole("heading", { name: "이전 캠페인 불러오기" });
  return userEvent.setup();
}

const checkbox = (name: string) =>
  screen.getByRole("checkbox", { name: `${name} 선택` });
const load = () => screen.getByRole("button", { name: "캠페인 불러오기" });

describe("이전 캠페인 불러오기 목록", () => {
  it("같은 서비스 유형의 캠페인을 최신순 카드로 보여 준다(TAB·MO)", async () => {
    await renderPanel();

    const cards = await screen.findAllByRole("listitem");
    // 카드마다 체크박스의 이름이 캠페인명임.
    expect(
      cards.map((card) =>
        within(card).getByRole("checkbox").getAttribute("aria-label"),
      ),
    ).toEqual([
      "신상 구매 리뷰 선택",
      "매장 오픈 이벤트 선택",
      "봄 신제품 체험 선택",
    ]);
    const first = cards[0] as HTMLElement;
    expect(within(first).getByText("구매리뷰형")).toBeInTheDocument();
    expect(within(first).getByText("2026.05.21")).toBeInTheDocument();
    // 모집형 캠페인은 PICK형 등록에 나오지 않는다.
    expect(screen.queryByText("여름 시즌 체험단")).toBeNull();
  });

  it("PC는 표로 보여 주고 머리글에 전체 선택 체크박스를 그리지 않는다", async () => {
    await renderPanel({ isDesktop: true });

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["", "캠페인명", "브랜드", "유형", "플랫폼", "등록일"]);
    // 체크박스는 데이터 행 3개뿐(머리글에는 없음).
    expect(within(table).getAllByRole("checkbox")).toHaveLength(3);
    expect(within(table).getByText("2026.03.14")).toBeInTheDocument();
  });

  it("한 개만 선택하고 다른 행을 고르면 앞 선택이 풀리며, 선택이 있을 때만 불러오기가 활성이다", async () => {
    const user = await renderPanel();
    await screen.findAllByRole("listitem");
    expect(load()).toBeDisabled();

    await user.click(checkbox("봄 신제품 체험"));
    expect(checkbox("봄 신제품 체험")).toBeChecked();
    expect(load()).toBeEnabled();

    await user.click(checkbox("매장 오픈 이벤트"));
    expect(checkbox("봄 신제품 체험")).not.toBeChecked();
    expect(checkbox("매장 오픈 이벤트")).toBeChecked();

    await user.click(checkbox("매장 오픈 이벤트"));
    expect(load()).toBeDisabled();
  });

  it("검색 버튼이나 Enter로 검색하고, 선택은 초기화된다", async () => {
    const user = await renderPanel();
    await screen.findAllByRole("listitem");
    await user.click(checkbox("봄 신제품 체험"));

    await user.type(
      screen.getByRole("searchbox", { name: "캠페인명 또는 브랜드명 검색" }),
      "오픈{Enter}",
    );

    expect(await screen.findAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("매장 오픈 이벤트")).toBeInTheDocument();
    expect(load()).toBeDisabled();
  });

  it("검색 결과가 없으면 목록 영역을 비워 둔다", async () => {
    const user = await renderPanel();
    await screen.findAllByRole("listitem");

    await user.type(
      screen.getByRole("searchbox", { name: "캠페인명 또는 브랜드명 검색" }),
      "없는캠페인{Enter}",
    );

    await screen.findByText("캠페인 목록");
    await vi.waitFor(() =>
      expect(screen.queryAllByRole("listitem")).toHaveLength(0),
    );
    expect(screen.getByText("캠페인 목록")).toBeInTheDocument();
  });

  it("모집형은 모집형 캠페인만 보인다", async () => {
    await renderPanel({ serviceType: "RECRUIT" });

    expect(await screen.findByText("여름 시즌 체험단")).toBeInTheDocument();
    expect(screen.getByText("가을 기자단 모집")).toBeInTheDocument();
    expect(screen.queryByText("봄 신제품 체험")).toBeNull();
  });
});

describe("이전 캠페인 불러오기 동작", () => {
  // 1단계 화면에서 시작해 "이전 캠페인 불러오기" 버튼으로 하위 화면을 엶.
  async function renderStepOne(now = new Date(2026, 10, 15, 12)) {
    vi.useFakeTimers({ toFake: ["Date"], now });
    stubWidth(false);
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    render(
      <SWRConfig
        value={{ provider: () => new Map(), shouldRetryOnError: false }}
      >
        <MemoryRouter initialEntries={["/?step=campaign-info"]}>
          <CampaignRegisterProvider campaignId={draft.campaignIdx}>
            <CampaignRegisterWizard />
          </CampaignRegisterProvider>
        </MemoryRouter>
      </SWRConfig>,
    );
    await screen.findByText(draft.campaignCode);
    return { draft, user: userEvent.setup() };
  }

  async function openAndSelect(
    user: ReturnType<typeof userEvent.setup>,
    name: string,
  ) {
    await user.click(
      screen.getByRole("button", { name: "이전 캠페인 불러오기" }),
    );
    await user.click(
      await screen.findByRole("checkbox", { name: `${name} 선택` }),
    );
  }

  it("입력한 값이 없으면 바로 불러와 1단계에 반영하고 캠페인 코드는 유지한다", async () => {
    const { draft, user } = await renderStepOne();

    await openAndSelect(user, "봄 신제품 체험");
    await user.click(load());

    expect(
      await screen.findByRole("textbox", { name: /캠페인명/ }),
    ).toHaveValue("봄 신제품 체험");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("radio", { name: "제품발송형" })).toBeChecked();
    expect(
      screen.getByRole("combobox", { name: /브랜드명/ }),
    ).toHaveTextContent("빅링크 코스메틱");
    expect(
      screen.getByRole("textbox", { name: /캠페인 기간/ }),
    ).toHaveTextContent("2026.12.31");
    expect(screen.getByText(draft.campaignCode)).toBeInTheDocument();
  });

  it("입력한 값이 있으면 덮어쓰기 확인을 먼저 띄우고, 취소하면 그대로 둔다", async () => {
    const { user } = await renderStepOne();
    await user.type(
      screen.getByRole("textbox", { name: /캠페인명/ }),
      "내가 쓴 이름",
    );

    await openAndSelect(user, "봄 신제품 체험");
    await user.click(load());
    const alert = await screen.findByRole("alertdialog");

    expect(alert).toHaveTextContent("이전 캠페인 불러오기");
    expect(alert).toHaveTextContent(
      "선택한 캠페인의 내용으로 지금 입력한 1~6단계 내용이 바뀝니다. 불러올까요?",
    );
    await user.click(within(alert).getByRole("button", { name: "취소" }));
    await vi.waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    // 하위 화면은 그대로 열려 있고 입력은 바뀌지 않았다.
    expect(load()).toBeInTheDocument();
  });

  it("덮어쓰기를 확인하면 불러온 값으로 바뀌고 하위 화면이 닫힌다", async () => {
    const { user } = await renderStepOne();
    await user.type(
      screen.getByRole("textbox", { name: /캠페인명/ }),
      "내가 쓴 이름",
    );

    await openAndSelect(user, "매장 오픈 이벤트");
    await user.click(load());
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "불러오기",
      }),
    );

    expect(
      await screen.findByRole("textbox", { name: /캠페인명/ }),
    ).toHaveValue("매장 오픈 이벤트");
    expect(screen.getByRole("radio", { name: "매장방문형" })).toBeChecked();
  });

  it("희망 시작일이 이미 지났으면 오늘로 맞춘다", async () => {
    const { user } = await renderStepOne(new Date(2027, 0, 15, 12));

    await openAndSelect(user, "봄 신제품 체험");
    await user.click(load());

    const period = await screen.findByRole("textbox", { name: /캠페인 기간/ });
    expect(period).toHaveTextContent("2027.02.14");
    expect(
      screen.getAllByRole("button", { name: /캠페인 기간/ })[0],
    ).toHaveTextContent("2027.01.15");
  });

  it("복사에 실패하면 실패 토스트를 띄우고 하위 화면을 그대로 둔다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    copyFailure.error = new ApiError(500, undefined);
    const { user } = await renderStepOne();

    await openAndSelect(user, "봄 신제품 체험");
    await user.click(load());

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "예상하지 못한 오류가 발생했습니다.",
      ),
    );
    expect(load()).toBeInTheDocument();
  });
});
