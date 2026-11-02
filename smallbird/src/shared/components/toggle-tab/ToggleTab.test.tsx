import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { ToggleTab } from "./ToggleTab";

const OPTIONS = [
  { value: "monthly", label: "월간 결제" },
  { value: "yearly", label: "연간 결제", description: "20% 할인" },
];

function Sample() {
  const [value, setValue] = useState("monthly");
  return (
    <ToggleTab
      aria-label="결제 주기"
      options={OPTIONS}
      value={value}
      onValueChange={setValue}
    />
  );
}

describe("ToggleTab", () => {
  it("선택된 항목을 따라다니는 표시 요소를 한 개 그리고, 선택이 바뀌면 값이 바뀐다", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sample />);

    // 선택 표시는 항목이 아니라 트랙 안의 표시 요소 하나가 그림(슬라이드 애니메이션용).
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "월간 결제" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /연간 결제/ }));

    expect(screen.getByRole("radio", { name: /연간 결제/ })).toBeChecked();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it("disabled 항목은 고를 수 없다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleTab
        aria-label="회원 유형"
        options={[
          { value: "advertiser", label: "광고주" },
          { value: "influencer", label: "인플루언서", disabled: true },
        ]}
        value="advertiser"
        onValueChange={onValueChange}
      />,
    );

    const influencer = screen.getByRole("radio", { name: "인플루언서" });
    expect(influencer).toBeDisabled();
    await user.click(influencer);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "광고주" })).toBeChecked();
  });
});
