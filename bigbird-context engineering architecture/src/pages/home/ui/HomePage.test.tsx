import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { ApiError, serverApi } from "@/shared/api";

import { HomePage } from "./HomePage";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
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

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderHome() {
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>
    </SWRConfig>,
  );
}

beforeEach(() => {
  vi.mocked(serverApi.get).mockReset().mockResolvedValue(session);
});

describe("HomePage", () => {
  it("로그인 사용자에게 히어로·검색·카드를 보여 준다", async () => {
    renderHome();
    expect(await screen.findByRole("heading", { level: 2 })).toHaveTextContent(
      "제품 정보를 입력하면 AI가 딱 맞는 인플루언서를 찾아드려요",
    );
    expect(
      screen.getByText(
        "AI가 브랜드와 목표에 맞는 인플루언서를 빠르게 추천해 드립니다",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "플랫폼" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "내 프로필" }),
    ).toBeInTheDocument();
  });

  it("비로그인에게도 같은 본문을 보여 준다", async () => {
    vi.mocked(serverApi.get).mockRejectedValue(
      new ApiError(401, { result: false }),
    );
    renderHome();
    expect(
      await screen.findByRole("heading", { level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("캠페인·요금 안내 카드는 비활성이고 준비 중 툴팁을 단다", async () => {
    renderHome();
    await screen.findByRole("heading", { level: 2 });
    for (const name of [/캠페인 등록\/운영/, /요금 안내/]) {
      const card = screen.getByRole("button", { name });
      expect(card).toHaveAttribute("aria-disabled", "true");
      expect(card.closest("[title]")).toHaveAttribute("title", "준비 중");
    }
  });

  it("비활성 카드를 눌러도 아무 일도 일어나지 않는다", async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByRole("heading", { level: 2 });
    await user.click(screen.getByRole("button", { name: /요금 안내/ }));
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("인플루언서 추천 카드는 활성이고 비로그인도 검색 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApi.get).mockRejectedValue(
      new ApiError(401, { result: false }),
    );
    renderHome();
    await screen.findByRole("heading", { level: 2 });
    const card = screen.getByRole("button", { name: /인플루언서 추천/ });
    expect(card).not.toHaveAttribute("aria-disabled");
    expect(card.closest("[title]")).toBeNull();
    await user.click(card);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/influencers/search",
    );
  });

  describe("인플루언서 추천 카드 터치", () => {
    async function renderCard() {
      renderHome();
      await screen.findByRole("heading", { level: 2 });
      return screen.getByRole("button", { name: /인플루언서 추천/ });
    }

    it("손가락을 대기만 해서는 이동하지 않고, 떼면 이동한다", async () => {
      const card = await renderCard();
      fireEvent.pointerDown(card, {
        pointerType: "touch",
        clientX: 100,
        clientY: 100,
      });
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
      fireEvent.pointerUp(card, {
        pointerType: "touch",
        clientX: 102,
        clientY: 101,
      });
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/influencers/search",
      );
    });

    it("스크롤하려고 대면(pointercancel) 이동하지 않는다", async () => {
      const card = await renderCard();
      fireEvent.pointerDown(card, {
        pointerType: "touch",
        clientX: 100,
        clientY: 100,
      });
      fireEvent.pointerCancel(card, { pointerType: "touch" });
      fireEvent.pointerUp(card, {
        pointerType: "touch",
        clientX: 100,
        clientY: 100,
      });
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    });

    it("많이 움직인 뒤 떼면 이동하지 않는다", async () => {
      const card = await renderCard();
      fireEvent.pointerDown(card, {
        pointerType: "touch",
        clientX: 100,
        clientY: 100,
      });
      fireEvent.pointerUp(card, {
        pointerType: "touch",
        clientX: 100,
        clientY: 160,
      });
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    });
  });

  it("인플루언서 추천 카드는 키보드 Enter로도 이동한다", async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByRole("heading", { level: 2 });
    screen.getByRole("button", { name: /인플루언서 추천/ }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/influencers/search",
    );
  });

  it("이전의 세션 요약은 보이지 않는다", async () => {
    renderHome();
    await screen.findByRole("heading", { level: 2 });
    expect(screen.queryByText(/로그인됨/)).not.toBeInTheDocument();
    expect(within(document.body).queryByText("권한")).not.toBeInTheDocument();
  });

  describe("키보드 활성 배치", () => {
    function stubKeyboard(visibleHeight: number) {
      vi.stubGlobal("innerHeight", 800);
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: ["(pointer: coarse)", "(max-width: 1439px)"].includes(query),
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
      vi.stubGlobal(
        "visualViewport",
        Object.assign(new EventTarget(), {
          height: visibleHeight,
          offsetTop: 0,
        }),
      );
      // jsdom에는 scrollIntoView가 없음. 키보드가 열릴 때 셸이 입력 영역을 보이게 스크롤함.
      Element.prototype.scrollIntoView = vi.fn();
    }

    afterEach(() => vi.unstubAllGlobals());

    it("키보드가 떠 있는 동안 카드 묶음이 입력창 위로 올라간다", async () => {
      stubKeyboard(450);
      const user = userEvent.setup();
      renderHome();
      await screen.findByRole("heading", { level: 2 });
      const container = screen.getByRole("textbox").closest("[data-keyboard]");
      expect(container).toHaveAttribute("data-keyboard", "closed");
      await user.click(screen.getByRole("textbox"));
      expect(container).toHaveAttribute("data-keyboard", "open");
      const cards = screen.getByRole("button", { name: /요금 안내/ })
        .parentElement?.parentElement;
      expect(cards?.className).toContain("order-first");
    });

    it("키보드가 열리는 순간 한 번만 입력 영역(버튼 줄 포함)이 보이게 스크롤한다", async () => {
      stubKeyboard(450);
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const user = userEvent.setup();
      renderHome();
      const textbox = await screen.findByRole("textbox");
      await user.click(textbox);
      await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "end" });
      expect(scrollIntoView.mock.contexts[0]).toBe(
        textbox.closest("[data-keyboard-anchor]"),
      );
    });

    it("입력창이 그대로 마운트되어 포커스를 유지한다", async () => {
      stubKeyboard(450);
      const user = userEvent.setup();
      renderHome();
      const textbox = await screen.findByRole("textbox");
      await user.click(textbox);
      expect(screen.getByRole("textbox")).toBe(textbox);
      expect(textbox).toHaveFocus();
    });

    it("키보드가 내려가 보이는 영역이 돌아오면 기본 순서로 돌아간다", async () => {
      stubKeyboard(450);
      const user = userEvent.setup();
      renderHome();
      await user.click(await screen.findByRole("textbox"));
      const container = screen.getByRole("textbox").closest("[data-keyboard]");
      act(() => {
        const viewport = window.visualViewport as unknown as EventTarget & {
          height: number;
        };
        viewport.height = 800;
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(container).toHaveAttribute("data-keyboard", "closed");
    });
  });
});
