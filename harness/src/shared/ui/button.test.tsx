import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button type", () => {
  it("type을 넘기지 않으면 form 안에서도 제출하지 않는다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: React.FormEvent) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={handleSubmit}>
        <Button>닫기</Button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('type="submit"을 넘기면 제출한다', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: React.FormEvent) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">제출</Button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "제출" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("asChild 링크에는 type 속성을 붙이지 않는다", () => {
    render(
      <Button asChild>
        <a href="/home">홈</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "type",
    );
  });
});
