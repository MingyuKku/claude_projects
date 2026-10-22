import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteSubAccountDialog } from "./DeleteSubAccountDialog";

import type { SubAccountViewModel } from "../model/types";

const account: SubAccountViewModel = {
  accountIdx: 9001,
  identifier: "sub02",
  name: "이마케팅",
  email: "sub02@bigbird.com",
  createdAt: new Date(2024, 4, 9),
};

function setup(target: SubAccountViewModel | null = account) {
  const handlers = { onCancel: vi.fn(), onConfirm: vi.fn() };
  render(<DeleteSubAccountDialog account={target} {...handlers} />);
  return { handlers, user: userEvent.setup() };
}

describe("DeleteSubAccountDialog", () => {
  it("대상이 없으면 열리지 않는다", () => {
    setup(null);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("제목과 대상 아이디를 넣은 본문, 취소·삭제 버튼을 보인다", () => {
    setup();
    const dialog = screen.getByRole("alertdialog", { name: "Sub ID 삭제" });
    expect(dialog).toHaveTextContent(
      "‘sub02’를 삭제하시겠습니까? 삭제된 데이터는 복구되지 않습니다.",
    );
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("삭제를 누르면 대상 항목과 함께 확인을 알린다", async () => {
    const { user, handlers } = setup();
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(handlers.onConfirm).toHaveBeenCalledWith(account);
  });

  it("취소를 누르거나 Esc로 닫으면 취소를 알리고 삭제는 하지 않는다", async () => {
    const { user, handlers } = setup();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(handlers.onCancel).toHaveBeenCalled();
    expect(handlers.onConfirm).not.toHaveBeenCalled();
  });
});
