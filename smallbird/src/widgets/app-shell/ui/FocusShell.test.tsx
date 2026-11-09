import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { FocusShell } from "./FocusShell";

function renderShell(props: Partial<Parameters<typeof FocusShell>[0]> = {}) {
  const onBack = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <FocusShell
          session={null}
          title="캠페인 등록"
          onBack={onBack}
          {...props}
        >
          <p>본문</p>
        </FocusShell>
      </MemoryRouter>
    </SWRConfig>,
  );
  return { onBack };
}

describe("FocusShell", () => {
  it("LNB 없이 뒤로가기 버튼과 제목, 본문을 그린다", () => {
    renderShell();

    expect(screen.getByRole("heading", { name: "캠페인 등록" })).toBeVisible();
    expect(screen.getByText("본문")).toBeVisible();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "메뉴 열기" })).toBeNull();
  });

  it("뒤로가기 버튼을 누르면 onBack을 부른다", async () => {
    const { onBack } = renderShell();

    await userEvent.click(screen.getByRole("button", { name: "뒤로가기" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("사이드바 자리에 넘긴 내용을 그린다", () => {
    renderShell({ sidebar: <nav aria-label="단계">단계 목록</nav> });

    expect(screen.getByText("단계 목록")).toBeInTheDocument();
  });
});
