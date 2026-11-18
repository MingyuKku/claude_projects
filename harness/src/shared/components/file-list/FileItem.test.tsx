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

  it("자모가 풀어진(NFD) 한글 이름도 글자 단위로 5자까지 보인다", () => {
    // macOS에서 올린 파일은 이름이 자모 단위로 분리되어 와 코드포인트로 세면 2글자만 보임
    renderFile("펫프렌즈캠페인안내서.pdf".normalize("NFD"));
    expect(screen.getByText("펫프렌즈캠...")).toBeInTheDocument();
  });

  it("내려받는 이름은 줄이지 않는다", () => {
    renderFile("파일명파일명파일명.pdf");
    expect(screen.getByRole("link")).toHaveAttribute(
      "download",
      "파일명파일명파일명.pdf",
    );
  });
});
