import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { FocusShell } from "./FocusShell";

function renderShell(onBack = vi.fn()) {
  render(
    <MemoryRouter>
      <SWRConfig value={{ provider: () => new Map() }}>
        <FocusShell
          session={null}
          title="캠페인 등록"
          sidebar={<nav aria-label="등록 단계">단계 목록</nav>}
          onBack={onBack}
        >
          <p>본문</p>
        </FocusShell>
      </SWRConfig>
    </MemoryRouter>,
  );
  return onBack;
}

describe("FocusShell", () => {
  it("LNB 없이 제목·사이드바 자리·본문을 그린다", () => {
    renderShell();

    expect(
      screen.getByRole("heading", { name: "캠페인 등록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "등록 단계" }).closest("aside"),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("본문");
    // AppShell의 LNB 메뉴 버튼(메뉴 열기) 대신 뒤로가기만 있음.
    expect(
      screen.queryByRole("button", { name: "메뉴 열기" }),
    ).not.toBeInTheDocument();
  });

  it('헤더 "<"를 누르면 onBack을 부른다', async () => {
    const user = userEvent.setup();
    const onBack = renderShell();

    await user.click(screen.getByRole("button", { name: "뒤로가기" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
