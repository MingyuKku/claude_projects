import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("안내 문구와 홈 링크를 한국어로 렌더링한다", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "홈으로 돌아가기" }),
    ).toHaveAttribute("href", "/");
  });
});
