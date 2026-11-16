import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StepSidebar } from "./StepSidebar";

const LABELS = { editing: "입력 중", warning: "필수 항목 미입력" };

describe("StepSidebar", () => {
  it("현재 단계를 표시하고, 비활성 단계는 누를 수 없으며, 오른쪽 표시를 읽어 준다", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <StepSidebar
        label="등록 단계"
        indicatorLabels={LABELS}
        onSelect={onSelect}
        items={[
          { id: "a", number: 1, label: "첫 단계", state: "current" },
          {
            id: "b",
            number: 2,
            label: "둘째 단계",
            state: "default",
            indicator: "editing",
          },
          {
            id: "c",
            number: 3,
            label: "셋째 단계",
            state: "default",
            indicator: "warning",
          },
          { id: "d", number: 4, label: "넷째 단계", state: "disabled" },
        ]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "등록 단계" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /첫 단계/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("img", { name: "입력 중" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "필수 항목 미입력" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /넷째 단계/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /둘째 단계/ }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
