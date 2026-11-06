import { render, screen } from "@testing-library/react";

import { FileItem } from "./FileItem";

function renderFile(name: string) {
  render(<FileItem name={name} sizeLabel="2.5MB" downloadHref="/f" />);
}

describe("FileItem 파일 이름", () => {
  it("5자를 넘으면 앞 5자와 ...만 보이고, 전체 이름은 title에 남는다", () => {
    renderFile("파일명파일명파일명.pdf");
    expect(screen.getByText("파일명파일...")).toHaveAttribute(
      "title",
      "파일명파일명파일명.pdf",
    );
  });

  it("5자 이하면 그대로 보인다", () => {
    renderFile("abcde");
    expect(screen.getByText("abcde")).toBeInTheDocument();
  });

  it("6자부터 줄인다", () => {
    renderFile("abcdef");
    expect(screen.getByText("abcde...")).toBeInTheDocument();
  });

  it("내려받는 이름은 줄이지 않는다", () => {
    renderFile("파일명파일명파일명.pdf");
    expect(screen.getByRole("link")).toHaveAttribute(
      "download",
      "파일명파일명파일명.pdf",
    );
  });
});
