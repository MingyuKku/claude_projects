import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CostFilterPopover } from "./CostFilterPopover";

function setup() {
  const onChangeValue = vi.fn();
  render(
    <CostFilterPopover
      label="희망비용"
      value={undefined}
      onChangeValue={onChangeValue}
    />,
  );
  return { user: userEvent.setup(), onChangeValue };
}

describe("CostFilterPopover", () => {
  it("입력하는 동안은 반영하지 않고 팝오버를 닫을 때 한 번 반영한다", async () => {
    const { user, onChangeValue } = setup();
    await user.click(screen.getByRole("button", { name: "희망비용" }));
    await user.type(
      await screen.findByRole("textbox", { name: "금액 선택 최소값" }),
      "50000",
    );
    expect(onChangeValue).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onChangeValue).toHaveBeenCalledOnce();
    expect(onChangeValue).toHaveBeenCalledWith({ min: 50_000, max: null });
  });

  it("최소가 최대보다 크면 닫지 않고 알럿을 띄운다", async () => {
    const { user, onChangeValue } = setup();
    await user.click(screen.getByRole("button", { name: "희망비용" }));
    await user.type(
      await screen.findByRole("textbox", { name: "금액 선택 최소값" }),
      "500",
    );
    await user.type(
      screen.getByRole("textbox", { name: "금액 선택 최대값" }),
      "100",
    );
    await user.click(document.body);

    expect(
      await screen.findByRole("alertdialog", {
        name: "입력값을 확인해 주세요",
      }),
    ).toBeInTheDocument();
    expect(onChangeValue).not.toHaveBeenCalled();
  });

  it("잘못 친 칸에서 반대 칸으로 바로 옮겨도 방금 친 칸만 비운다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "희망비용" }));
    const min = await screen.findByRole("textbox", {
      name: "금액 선택 최소값",
    });
    const max = screen.getByRole("textbox", { name: "금액 선택 최대값" });
    await user.type(max, "100");
    await user.type(min, "500");
    await user.click(max);

    await user.click(await screen.findByRole("button", { name: "확인" }));

    expect(min).toHaveValue("");
    expect(max).toHaveValue("100");
  });
});
