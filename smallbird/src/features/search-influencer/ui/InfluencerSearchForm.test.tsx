import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { InfluencerSearchForm } from "./InfluencerSearchForm";

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <p data-testid="location">{`${pathname}${search}`}</p>;
}

function renderForm() {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <>
            <InfluencerSearchForm />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function stubMedia(...matching: string[]) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.includes(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => vi.unstubAllGlobals());

const QUERY_NAME = "ex) 스킨케어 신제품 홍보, 20대 여성 타깃, 인스타 중심";

function getSubmit() {
  return screen.getByRole("button", { name: "인플루언서 탐색" });
}

describe("InfluencerSearchForm", () => {
  it("공백만 있으면 제출 버튼이 비활성화된다", async () => {
    const user = userEvent.setup();
    renderForm();
    expect(getSubmit()).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: QUERY_NAME }), "   ");
    expect(getSubmit()).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "a");
    expect(getSubmit()).toBeEnabled();
  });

  it("최대 1000자까지만 입력할 수 있다", () => {
    renderForm();
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "1000");
  });

  it("버튼으로 제출하면 플랫폼 없이 검색 경로로 이동한다", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox"), " 스킨케어 ");
    await user.click(getSubmit());
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/influencers/search?q=%EC%8A%A4%ED%82%A8%EC%BC%80%EC%96%B4",
    );
    expect(screen.getByTestId("location")).not.toHaveTextContent("platform");
  });

  describe("PC", () => {
    it("Enter로 제출하고 Shift+Enter는 줄바꿈한다", async () => {
      const user = userEvent.setup();
      const router = renderForm();
      const textbox = screen.getByRole("textbox");
      await user.type(textbox, "a{Shift>}{Enter}{/Shift}b");
      expect(textbox).toHaveValue("a\nb");
      expect(router.state.location.pathname).toBe("/");
      await user.keyboard("{Enter}");
      expect(router.state.location.pathname).toBe("/influencers/search");
      expect(router.state.location.search).toBe("?q=a%0Ab");
    });

    it("한글 조합 중 Enter는 제출하지 않는다", () => {
      const router = renderForm();
      const textbox = screen.getByRole("textbox");
      fireEvent.change(textbox, { target: { value: "스킨케어" } });
      fireEvent.keyDown(textbox, { key: "Enter", isComposing: true });
      expect(router.state.location.pathname).toBe("/");
    });
  });

  it("터치 기기에서는 Enter가 줄바꿈이고 제출하지 않는다", async () => {
    stubMedia("(pointer: coarse)");
    const user = userEvent.setup();
    const router = renderForm();
    const textbox = screen.getByRole("textbox");
    await user.type(textbox, "a{Enter}b");
    expect(textbox).toHaveValue("a\nb");
    expect(router.state.location.pathname).toBe("/");
  });

  describe("플랫폼", () => {
    it("항상 버튼에 이름이 보이고 플랫폼을 고르면 쿼리에 platform이 붙는다", async () => {
      const user = userEvent.setup();
      const router = renderForm();
      expect(getSubmit()).toHaveTextContent("인플루언서 탐색");
      await user.click(screen.getByRole("button", { name: "플랫폼" }));
      await user.click(
        await screen.findByRole("menuitemcheckbox", { name: "인스타그램" }),
      );
      expect(getSubmit()).toHaveTextContent("인플루언서 탐색");
      expect(
        screen.getByRole("button", { name: "인스타그램" }),
      ).toBeInTheDocument();
      await user.type(screen.getByRole("textbox"), "hi");
      await user.click(getSubmit());
      expect(router.state.location.search).toBe("?q=hi&platform=instagram");
    });

    it("선택한 플랫폼을 다시 눌러도 해제되지 않는다", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole("button", { name: "플랫폼" }));
      await user.click(
        await screen.findByRole("menuitemcheckbox", { name: "틱톡" }),
      );
      await user.click(screen.getByRole("button", { name: "틱톡" }));
      await user.click(
        await screen.findByRole("menuitemcheckbox", { name: "틱톡" }),
      );
      expect(screen.getByRole("button", { name: "틱톡" })).toBeInTheDocument();
    });
  });

  describe("긴 글 펼치기", () => {
    const LINE_HEIGHT = 20;

    // 글의 줄 수를 scrollHeight로 흉내 냄(jsdom은 레이아웃이 없음).
    function mockLines(lines: number) {
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "scrollHeight",
        "get",
      ).mockReturnValue(lines * LINE_HEIGHT);
    }

    async function typeLines(lines: number) {
      const user = userEvent.setup();
      mockLines(lines);
      renderForm();
      await user.type(screen.getByRole("textbox"), "긴 글");
      return user;
    }

    it("글이 4줄까지는 펼치기 아이콘이 없고 5줄부터 보인다", async () => {
      const user = await typeLines(4);
      expect(
        screen.queryByRole("button", { name: "펼치기" }),
      ).not.toBeInTheDocument();
      mockLines(5);
      await user.type(screen.getByRole("textbox"), "더");
      expect(
        screen.getByRole("button", { name: "펼치기" }),
      ).toBeInTheDocument();
      mockLines(4);
      await user.type(screen.getByRole("textbox"), "x");
      expect(
        screen.queryByRole("button", { name: "펼치기" }),
      ).not.toBeInTheDocument();
    });

    it("모바일은 8줄을 넘어 입력창 안에서 스크롤이 생길 때만 펼치기 아이콘을 보여 준다", async () => {
      stubMedia("(max-width: 767px)");
      const user = await typeLines(8);
      expect(
        screen.queryByRole("button", { name: "펼치기" }),
      ).not.toBeInTheDocument();
      mockLines(9);
      await user.type(screen.getByRole("textbox"), "더");
      expect(
        screen.getByRole("button", { name: "펼치기" }),
      ).toBeInTheDocument();
    });

    it("펼치기 버튼은 mousedown에서 포커스를 가져가지 않아 모바일 키보드가 유지된다", async () => {
      const user = await typeLines(6);
      const textbox = screen.getByRole("textbox");
      textbox.focus();
      const button = await screen.findByRole("button", { name: "펼치기" });
      // preventDefault가 호출되면 fireEvent는 false를 돌려줌.
      expect(fireEvent.mouseDown(button)).toBe(false);
      expect(textbox).toHaveFocus();
      await user.click(button);
      expect(textbox).toHaveFocus();
    });

    it("펼치기 전에는 최소 4줄에서 8줄까지 늘어난다", async () => {
      await typeLines(6);
      const { className } = screen.getByRole("textbox");
      expect(className).toContain("min-h-[4lh]");
      expect(className).toContain("max-h-[8lh]");
    });

    it("펼치면 모달 없이 같은 입력창이 고정 높이로 커지고 포커스를 유지한다", async () => {
      const user = await typeLines(6);
      const textbox = screen.getByRole("textbox");
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBe(textbox);
      expect(textbox).toHaveFocus();
      expect(textbox.className).toContain("flex-1");
      expect(textbox.className).not.toContain("max-h-[8lh]");
      expect(
        textbox
          .closest("form")
          ?.style.getPropertyValue("--search-expanded-height"),
      ).not.toBe("");
    });

    it("축소 아이콘으로 접고 글은 그대로 남는다", async () => {
      const user = await typeLines(6);
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      await user.click(screen.getByRole("button", { name: "축소" }));
      const textbox = screen.getByRole("textbox");
      expect(textbox.className).toContain("max-h-[8lh]");
      expect(textbox).toHaveValue("긴 글");
      expect(
        screen.getByRole("button", { name: "펼치기" }),
      ).toBeInTheDocument();
    });

    it("Esc로 접는다", async () => {
      const user = await typeLines(6);
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      await user.keyboard("{Escape}");
      expect(screen.getByRole("textbox").className).toContain("max-h-[8lh]");
      expect(screen.getByRole("textbox")).toHaveValue("긴 글");
    });

    it("펼친 상태에서 글을 모두 지우면 접힌다", async () => {
      const user = await typeLines(6);
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      await user.clear(screen.getByRole("textbox"));
      expect(screen.getByRole("textbox").className).toContain("max-h-[8lh]");
    });

    it("펼친 입력창에서도 제출한다", async () => {
      const user = await typeLines(6);
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      await user.click(getSubmit());
      await waitFor(() =>
        expect(screen.getByTestId("location")).toHaveTextContent(
          "/influencers/search?q=",
        ),
      );
    });
  });
});
