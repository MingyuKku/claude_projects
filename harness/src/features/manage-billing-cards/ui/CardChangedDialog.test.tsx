import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CardChangedDialog } from "./CardChangedDialog";

describe("CardChangedDialog", () => {
  it("변경 완료 문구와 확인 버튼만 보이고 확인하면 닫힌다", async () => {
    const onConfirm = vi.fn();
    render(<CardChangedDialog open onConfirm={onConfirm} />);

    expect(screen.getByText("결제카드 변경 완료")).toBeVisible();
    expect(screen.getByText("결제 카드가 변경되었습니다.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "취소" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("닫혀 있으면 아무것도 보이지 않는다", () => {
    render(<CardChangedDialog open={false} onConfirm={vi.fn()} />);
    expect(screen.queryByText("결제카드 변경 완료")).toBeNull();
  });
});
