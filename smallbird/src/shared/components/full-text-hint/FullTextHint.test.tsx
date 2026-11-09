import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FullTextHint } from "./FullTextHint";

const NAME = "F&B 신제품 브랜드 기획전";

/** jsdom은 레이아웃이 없어 그려진 높이를 흉내 냄(넘친 줄은 아래로 숨음). */
function stubHeights(scrollHeight: number, clientHeight: number) {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
    clientHeight,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("FullTextHint", () => {
  it("한 줄에 다 보이는 이름은 버튼 없이 글자로만 그리고 올려도 전체 이름을 띄우지 않는다", async () => {
    stubHeights(20, 20);
    const user = userEvent.setup();
    render(<FullTextHint text={NAME} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await user.hover(screen.getByText(NAME));

    expect(screen.getAllByText(NAME)).toHaveLength(1);
  });

  it("잘린 이름은 올리면 전체 이름을 띄우고 벗어나면 닫는다", async () => {
    stubHeights(40, 20);
    const user = userEvent.setup();
    render(<FullTextHint text={NAME} />);
    const trigger = screen.getByRole("button", { name: NAME });

    await user.hover(trigger);
    expect(screen.getAllByText(NAME)).toHaveLength(2);

    await user.unhover(trigger);
    expect(screen.getAllByText(NAME)).toHaveLength(1);
  });

  it("잘린 이름은 눌러도(터치) 전체 이름을 띄운다", async () => {
    stubHeights(40, 20);
    const user = userEvent.setup();
    render(<FullTextHint text={NAME} />);

    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: NAME }),
    });

    expect(screen.getAllByText(NAME)).toHaveLength(2);
  });
});
