import { render, screen } from "@testing-library/react";

import { WelcomePage } from "./WelcomePage";

describe("WelcomePage", () => {
  it("승인 대기 안내를 줄바꿈과 함께 보여 준다", () => {
    const { container } = render(<WelcomePage />);

    expect(
      screen.getByRole("heading", { name: /파트너가 되어 반가워요/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/광고주 회원가입을 검토 중입니다/)).toBeVisible();
    expect(container.querySelectorAll("p br")).toHaveLength(2);
    expect(container).not.toHaveTextContent("<br");
    expect(
      screen.getByRole("button", { name: "BIGBIRD 둘러보기" }),
    ).toBeInTheDocument();
  });
});
