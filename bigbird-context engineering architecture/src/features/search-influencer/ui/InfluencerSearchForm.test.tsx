import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

  describe("플랫폼과 wide 전환", () => {
    function stubOverflow() {
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "scrollHeight",
        "get",
      ).mockReturnValue(40);
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "clientHeight",
        "get",
      ).mockReturnValue(20);
    }

    it("플랫폼을 골라도 한 줄을 유지하고 쿼리에 platform이 붙는다", async () => {
      const user = userEvent.setup();
      const router = renderForm();
      expect(getSubmit()).toHaveTextContent("");
      await user.click(screen.getByRole("button", { name: "플랫폼" }));
      await user.click(
        await screen.findByRole("menuitemcheckbox", { name: "인스타그램" }),
      );
      expect(getSubmit()).toHaveTextContent("");
      expect(
        screen.getByRole("button", { name: "인스타그램" }),
      ).toBeInTheDocument();
      await user.type(screen.getByRole("textbox"), "hi");
      await user.click(getSubmit());
      expect(router.state.location.search).toBe("?q=hi&platform=instagram");
    });

    it("문구를 모두 지우면 플랫폼을 고른 상태여도 한 줄로 돌아간다", async () => {
      const user = userEvent.setup();
      renderForm();
      stubOverflow();
      await user.click(screen.getByRole("button", { name: "플랫폼" }));
      await user.click(
        await screen.findByRole("menuitemcheckbox", { name: "네이버" }),
      );
      const textbox = screen.getByRole("textbox");
      await user.type(textbox, "ab");
      expect(getSubmit()).toHaveTextContent("인플루언서 탐색");
      await user.clear(textbox);
      expect(getSubmit()).toHaveTextContent("");
      expect(
        screen.getByRole("button", { name: "네이버" }),
      ).toBeInTheDocument();
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

    it("문구가 한 줄을 넘으면 wide가 되고 입력 포커스를 유지한다", async () => {
      const user = userEvent.setup();
      renderForm();
      const textbox = screen.getByRole("textbox");
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "scrollHeight",
        "get",
      ).mockReturnValue(40);
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "clientHeight",
        "get",
      ).mockReturnValue(20);
      await user.type(textbox, "a");
      expect(getSubmit()).toHaveTextContent("인플루언서 탐색");
      expect(screen.getByRole("textbox")).toBe(textbox);
      expect(textbox).toHaveFocus();
    });

    it("모바일은 항상 wide이다", () => {
      stubMedia("(max-width: 767px)");
      renderForm();
      expect(getSubmit()).toHaveTextContent("인플루언서 탐색");
    });
  });

  describe("긴 글 펼치기", () => {
    function mockOverflow(isOverflowing: boolean) {
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "scrollHeight",
        "get",
      ).mockReturnValue(isOverflowing ? 120 : 20);
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "clientHeight",
        "get",
      ).mockReturnValue(isOverflowing ? 68 : 20);
    }

    async function openDialog() {
      const user = userEvent.setup();
      stubMedia("(max-width: 767px)");
      mockOverflow(true);
      const router = renderForm();
      await user.type(screen.getByRole("textbox"), "긴 글");
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      return { user, router, dialog: await screen.findByRole("dialog") };
    }

    it("글이 최대 높이를 넘을 때만 펼치기 아이콘을 보여 준다", async () => {
      const user = userEvent.setup();
      stubMedia("(max-width: 767px)");
      mockOverflow(false);
      renderForm();
      await user.type(screen.getByRole("textbox"), "짧은 글");
      expect(
        screen.queryByRole("button", { name: "펼치기" }),
      ).not.toBeInTheDocument();
      mockOverflow(true);
      await user.type(screen.getByRole("textbox"), "더");
      expect(
        screen.getByRole("button", { name: "펼치기" }),
      ).toBeInTheDocument();
      mockOverflow(false);
      await user.clear(screen.getByRole("textbox"));
      expect(
        screen.queryByRole("button", { name: "펼치기" }),
      ).not.toBeInTheDocument();
    });

    it("펼치면 같은 값을 보여 주는 모달이 열리고 입력에 포커스한다", async () => {
      const { dialog } = await openDialog();
      const textbox = within(dialog).getByRole("textbox");
      expect(textbox).toHaveValue("긴 글");
      expect(textbox).toHaveFocus();
    });

    it("모달에서 고친 글은 축소로 닫은 뒤에도 남고 기존 입력창에 포커스가 돌아온다", async () => {
      const { user, dialog } = await openDialog();
      await user.type(within(dialog).getByRole("textbox"), " 추가");
      await user.click(within(dialog).getByRole("button", { name: "축소" }));
      // iOS 키보드 유지를 위해 닫는 같은 이벤트 안에서 동기로 포커스가 돌아와야 한다.
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      const textbox = screen.getByRole("textbox");
      expect(textbox).toHaveValue("긴 글 추가");
      expect(textbox).toHaveFocus();
    });

    it("Esc로 닫는다", async () => {
      const { user } = await openDialog();
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("textbox")).toHaveValue("긴 글");
    });

    it("뒤로가기로 닫는다", async () => {
      await openDialog();
      act(() => window.history.back());
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("textbox")).toHaveValue("긴 글");
    });

    it("모달에서 제출하면 이동하면서 닫힌다", async () => {
      const { user, router, dialog } = await openDialog();
      await user.click(
        within(dialog).getByRole("button", { name: "인플루언서 탐색" }),
      );
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/influencers/search"),
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("모달에서도 PC는 Enter로 제출한다", async () => {
      const { user, router, dialog } = await openDialog();
      await user.type(within(dialog).getByRole("textbox"), "{Enter}");
      await waitFor(() =>
        expect(router.state.location.search).toBe(
          `?${new URLSearchParams({ q: "긴 글" })}`,
        ),
      );
    });
  });

  describe("PC 인라인 펼치기", () => {
    async function typeLongOnDesktop() {
      const user = userEvent.setup();
      stubMedia("(min-width: 1440px)");
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "scrollHeight",
        "get",
      ).mockReturnValue(120);
      vi.spyOn(
        HTMLTextAreaElement.prototype,
        "clientHeight",
        "get",
      ).mockReturnValue(68);
      renderForm();
      await user.type(screen.getByRole("textbox"), "긴 글");
      return user;
    }

    it("모달 없이 입력창 높이만 키우고 축소로 되돌린다", async () => {
      const user = await typeLongOnDesktop();
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox").className).toContain(
        "h-[min(50dvh,24rem)]",
      );
      await user.click(screen.getByRole("button", { name: "축소" }));
      expect(screen.getByRole("textbox").className).not.toContain(
        "h-[min(50dvh,24rem)]",
      );
      expect(
        screen.getByRole("button", { name: "펼치기" }),
      ).toBeInTheDocument();
    });

    it("펼친 상태에서 글을 모두 지우면 접힌다", async () => {
      const user = await typeLongOnDesktop();
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      await user.clear(screen.getByRole("textbox"));
      expect(screen.getByRole("textbox").className).not.toContain(
        "h-[min(50dvh,24rem)]",
      );
    });

    it("펼쳐도 같은 입력창이고 포커스를 유지한다", async () => {
      const user = await typeLongOnDesktop();
      const textbox = screen.getByRole("textbox");
      await user.click(await screen.findByRole("button", { name: "펼치기" }));
      expect(screen.getByRole("textbox")).toBe(textbox);
    });
  });
});
