import { render, screen } from "@testing-library/react";

import { IntroductionPage } from "./IntroductionPage";

describe("IntroductionPage", () => {
  it("히어로 헤드라인을 렌더링한다", () => {
    render(<IntroductionPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /인플루언서 마케팅,/ }),
    ).toHaveTextContent("더 정확하게 시작하세요");
  });

  it("페이지 제목과 설명 메타 태그를 head 로 올린다", () => {
    render(<IntroductionPage />);

    expect(document.title).toContain("빅버드");
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).toBeInTheDocument();
  });
});
