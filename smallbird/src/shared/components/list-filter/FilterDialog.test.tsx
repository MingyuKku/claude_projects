import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FilterDialog } from "./FilterDialog";

import type { FilterField } from "./filter-fields";

const FIELDS: FilterField[] = [
  {
    type: "date",
    id: "date",
    label: "충전 일자",
    placeholder: "날짜를 선택하세요.",
  },
  {
    type: "select",
    id: "status",
    label: "입금 상태",
    placeholder: "입금 상태를 선택하세요.",
    options: [
      { value: "결제완료", label: "결제 완료" },
      { value: "대기중", label: "대기 중" },
    ],
  },
];

// jsdom에는 Radix Select가 쓰는 포인터 캡처·스크롤 API가 없음.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

function renderDialog(values = {}) {
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <FilterDialog
      isOpen
      onClose={onClose}
      fields={FIELDS}
      values={values}
      onApply={onApply}
    />,
  );
  return { onApply, onClose };
}

describe("FilterDialog", () => {
  it("바꾼 것이 없으면 적용하기가 비활성이다", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "적용하기" })).toBeDisabled();
  });

  it("입금 상태를 고르면 적용하기가 켜지고 고른 값으로 적용한다", async () => {
    const user = userEvent.setup();
    const { onApply } = renderDialog();

    await user.click(screen.getByRole("combobox", { name: "입금 상태" }));
    await user.click(screen.getByRole("option", { name: "대기 중" }));
    await user.click(screen.getByRole("button", { name: "적용하기" }));

    expect(onApply).toHaveBeenCalledWith({ status: "대기중" });
  });

  it("초기화는 입력만 비우고 적용은 하지 않는다", async () => {
    const user = userEvent.setup();
    const { onApply } = renderDialog({ status: "결제완료" });

    await user.click(screen.getByRole("button", { name: "초기화" }));

    expect(onApply).not.toHaveBeenCalled();
    // 적용된 값(결제완료)과 달라졌으므로 비우고 적용할 수 있다.
    await user.click(screen.getByRole("button", { name: "적용하기" }));
    expect(onApply).toHaveBeenCalledWith({});
  });
});
