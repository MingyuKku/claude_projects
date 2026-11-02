import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";
import { MEDIA_QUERY } from "@/shared/config";

import { HomePage } from "./HomePage";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn() },
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
  vi.mocked(serverApiV3.get).mockReset().mockResolvedValue(session);
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
    expect(screen.getByRole("combobox", { name: "플랫폼" })).toHaveTextContent(
      "인스타그램",
    );
    expect(
      screen.getByRole("button", { name: "내 프로필" }),
    ).toBeInTheDocument();
  });

  it("비로그인에게도 같은 본문을 보여 준다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(
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

  it("인플루언서 추천 카드는 로그인하면 검색 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByRole("heading", { level: 2 });
    const card = screen.getByRole("button", { name: /인플루언서 추천/ });
    expect(card).not.toHaveAttribute("aria-disabled");
    await user.click(card);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/influencers/search",
    );
  });

  describe("비로그인", () => {
    beforeEach(() => {
      vi.mocked(serverApiV3.get).mockRejectedValue(
        new ApiError(401, { result: false }),
      );
    });

    it.each([/인플루언서 추천/, /캠페인 등록\/운영/])(
      "%s 카드를 누르면 이동하지 않고 로그인 안내 알럿을 띄운다",
      async (name) => {
        const user = userEvent.setup();
        renderHome();
        await screen.findByRole("heading", { level: 2 });
        await user.click(screen.getByRole("button", { name }));
        const alert = await screen.findByRole("alertdialog");
        expect(within(alert).getByText("로그인 필요")).toBeInTheDocument();
        expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
        await user.click(
          within(alert).getByRole("button", { name: "로그인하러 가기" }),
        );
        expect(screen.getByTestId("location")).toHaveTextContent("/login");
      },
    );

    it("세션을 확인하는 동안에는 알럿을 띄우지 않는다", async () => {
      // 확인이 끝나지 않는 세션(로그인한 사용자가 확인 중에 카드를 누르는 경우).
      vi.mocked(serverApiV3.get).mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      renderHome();
      await screen.findByRole("heading", { level: 2 });
      await user.click(
        screen.getByRole("button", { name: /캠페인 등록\/운영/ }),
      );
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("알럿의 취소를 누르면 닫히고 그대로 남는다", async () => {
      const user = userEvent.setup();
      renderHome();
      await screen.findByRole("heading", { level: 2 });
      await user.click(screen.getByRole("button", { name: /인플루언서 추천/ }));
      await user.click(
        within(await screen.findByRole("alertdialog")).getByRole("button", {
          name: "취소",
        }),
      );
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    });

    it("요금 안내 카드는 알럿 없이 비활성이다", async () => {
      const user = userEvent.setup();
      renderHome();
      await screen.findByRole("heading", { level: 2 });
      const card = screen.getByRole("button", { name: /요금 안내/ });
      expect(card).toHaveAttribute("aria-disabled", "true");
      await user.click(card);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
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
        matches:
          query === MEDIA_QUERY.touch || query === MEDIA_QUERY.belowDesktop,
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

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("키보드가 떠 있는 동안 카드가 입력창 위로 올라가고 입력창은 본문 아래에 고정된다", async () => {
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
      expect(cards?.className).toContain("in-data-[keyboard=open]:order-1");
      expect(screen.getByRole("textbox").closest("form")?.className).toContain(
        "in-data-[keyboard=open]:sticky",
      );
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

    it("키보드가 레이아웃을 줄이지 않는 iOS에서는 셸을 보이는 영역에 맞춰 줄이고 내린 만큼 따라 내린다", async () => {
      stubKeyboard(450);
      vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
        800,
      );
      Object.assign(window.visualViewport ?? {}, { offsetTop: 120, scale: 1 });
      const user = userEvent.setup();
      renderHome();
      const textbox = await screen.findByRole("textbox");
      const container = textbox.closest<HTMLElement>("[data-keyboard]");
      expect(container?.style.height).toBe("");
      await user.click(textbox);
      expect(container?.style.height).toBe("450px");
      expect(container?.style.top).toBe("120px");
      // 셸 바로 아래(키보드 뒤)를 페이지 배경으로 칠함.
      const gapPaint = container?.nextElementSibling;
      expect(gapPaint).toHaveAttribute("aria-hidden");
      expect(gapPaint).toHaveStyle({ top: "570px" });
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
