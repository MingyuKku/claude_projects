import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { FindEmailSentPage } from "./FindEmailSentPage";

describe("FindEmailSentPage", () => {
  it("발송 안내를 줄바꿈과 함께 보여 준다", () => {
    const { container } = render(
      <MemoryRouter>
        <FindEmailSentPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/등록된 이메일로 비밀번호 재설정 링크를 발송하였습니다/),
    ).toBeVisible();
    expect(container.querySelectorAll("p br")).toHaveLength(1);
    expect(container).not.toHaveTextContent("<br");
    expect(
      screen.getByRole("button", { name: "처음으로" }),
    ).toBeInTheDocument();
  });
});
