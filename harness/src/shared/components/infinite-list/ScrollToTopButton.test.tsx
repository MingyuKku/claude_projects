import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ScrollToTopButton } from "./ScrollToTopButton";

describe("ScrollToTopButton", () => {
  it("스크롤 조상이 조금 내려가야 나타나고 누르면 맨 위로 올린다", async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="scroller" style={{ overflowY: "auto" }}>
        <ScrollToTopButton label="맨 위로" threshold={100} />
      </div>,
    );
    const scroller = screen.getByTestId("scroller");
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo;
    expect(
      screen.queryByRole("button", { name: "맨 위로" }),
    ).not.toBeInTheDocument();

    act(() => {
      scroller.scrollTop = 300;
      fireEvent.scroll(scroller);
    });
    await user.click(screen.getByRole("button", { name: "맨 위로" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    act(() => {
      scroller.scrollTop = 0;
      fireEvent.scroll(scroller);
    });
    expect(
      screen.queryByRole("button", { name: "맨 위로" }),
    ).not.toBeInTheDocument();
  });
});
