import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FilterScreen } from "./FilterScreen";

import type { FilterField } from "./filter-fields";

const FIELDS: FilterField[] = [
  {
    type: "select",
    id: "status",
    label: "결제 상태",
    placeholder: "결제 상태를 선택하세요.",
    options: [
      { value: "paid", label: "결제 완료" },
      { value: "refunded", label: "환불 완료" },
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

describe("FilterScreen", () => {
  it("모달이 아니라 본문에 그려지고 고른 값으로 적용한다", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <FilterScreen
        onClose={vi.fn()}
        fields={FIELDS}
        values={{}}
        onApply={onApply}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "필터 검색 설정" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "적용하기" })).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "결제 상태" }));
    await user.click(screen.getByRole("option", { name: "환불 완료" }));
    await user.click(screen.getByRole("button", { name: "적용하기" }));

    expect(onApply).toHaveBeenCalledWith({ status: "refunded" });
  });

  it("X를 누르면 적용 없이 닫는다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onApply = vi.fn();
    render(
      <FilterScreen
        onClose={onClose}
        fields={FIELDS}
        values={{}}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });
});
