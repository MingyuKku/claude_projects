import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CancelCompletedDialog } from "./CancelCompletedDialog";

describe("CancelCompletedDialog", () => {
  it("해지 완료 문구와 확인 버튼만 보이고 확인하면 닫힌다", async () => {
    const onConfirm = vi.fn();
    render(<CancelCompletedDialog open onConfirm={onConfirm} />);

    expect(screen.getByText("구독 해지 완료")).toBeVisible();
    expect(
      screen.getByText("구독 해지가 완료되었습니다. 다음에 다시 만나요!"),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "취소" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("닫혀 있으면 아무것도 보이지 않는다", () => {
    render(<CancelCompletedDialog open={false} onConfirm={vi.fn()} />);
    expect(screen.queryByText("구독 해지 완료")).toBeNull();
  });
});
