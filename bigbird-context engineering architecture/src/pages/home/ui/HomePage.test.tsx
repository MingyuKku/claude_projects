import { render, screen } from "@testing-library/react";

import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("제목을 렌더링한다", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "bigbird" }),
    ).toBeInTheDocument();
  });
});
