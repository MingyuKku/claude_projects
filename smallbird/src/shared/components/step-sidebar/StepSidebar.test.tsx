import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StepSidebar } from "./StepSidebar";

import type { StepSidebarItem } from "./StepSidebar";

const ITEMS: StepSidebarItem[] = [
  { id: "a", label: "첫째", number: 1, state: "done" },
  { id: "b", label: "둘째", number: 2, state: "current" },
  {
    id: "c",
    label: "셋째",
    number: 3,
    state: "visited",
    hasAlert: true,
    alertLabel: "미입력",
  },
  { id: "d", label: "넷째", number: 4, state: "unvisited" },
];

describe("StepSidebar", () => {
  it("현재 단계에만 aria-current를 두고 번호는 완료 단계만 체크로 바꾼다", () => {
    render(<StepSidebar navLabel="단계" items={ITEMS} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /둘째/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("button", { name: /첫째/ })).not.toHaveAttribute(
      "aria-current",
    );
    // 완료(첫째)는 번호 대신 체크라 번호 1이 보이지 않는다.
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("어느 단계든 눌러 이동할 수 있다(흐린 단계 포함)", async () => {
    const onSelect = vi.fn();
    render(<StepSidebar navLabel="단계" items={ITEMS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /넷째/ }));
    await userEvent.click(screen.getByRole("button", { name: /첫째/ }));

    expect(onSelect.mock.calls).toEqual([["d"], ["a"]]);
  });

  it("미완 경고는 빨간 테두리와 스크린 리더용 설명을 가진다", () => {
    render(<StepSidebar navLabel="단계" items={ITEMS} onSelect={() => {}} />);

    const alerted = screen.getByRole("button", { name: /셋째/ });

    expect(alerted).toHaveClass("border-destructive");
    expect(alerted).toHaveTextContent("미입력");
    expect(screen.getByRole("button", { name: /둘째/ })).not.toHaveClass(
      "border-destructive",
    );
  });

  it("작업 중인 단계는 로딩 표시와 스크린 리더용 설명을 가지고 경고 테두리는 없다", () => {
    render(
      <StepSidebar
        navLabel="단계"
        items={[
          {
            id: "e",
            label: "다섯째",
            number: 5,
            state: "visited",
            isBusy: true,
            busyLabel: "생성 중",
          },
        ]}
        onSelect={() => {}}
      />,
    );

    const busy = screen.getByRole("button", { name: /다섯째/ });

    expect(busy).toHaveTextContent("생성 중");
    expect(busy).not.toHaveClass("border-destructive");
    expect(busy.querySelector(".animate-spin")).not.toBeNull();
  });

  it("아직 안 간 단계는 흐리게 보인다", () => {
    render(<StepSidebar navLabel="단계" items={ITEMS} onSelect={() => {}} />);

    expect(screen.getByText("넷째").parentElement).toHaveClass("opacity-50");
    expect(screen.getByText("셋째").parentElement).not.toHaveClass(
      "opacity-50",
    );
  });

  it("맨 위 항목(기본정보)과 구분선을 둘 수 있다", async () => {
    const onSelect = vi.fn();
    render(
      <StepSidebar
        navLabel="단계"
        items={ITEMS}
        header={{ id: "overview", label: "기본정보", isCurrent: true }}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "기본정보" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await userEvent.click(screen.getByRole("button", { name: "기본정보" }));
    expect(onSelect).toHaveBeenCalledWith("overview");
  });
});
