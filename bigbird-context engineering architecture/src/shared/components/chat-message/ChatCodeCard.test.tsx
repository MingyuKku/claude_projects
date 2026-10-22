import { fireEvent, render } from "@testing-library/react";

import { ChatCodeCard } from "./ChatCodeCard";

function card(thumbnailSrc?: string) {
  return (
    <ChatCodeCard
      thumbnailSrc={thumbnailSrc}
      title="상품"
      description="브랜드"
      codeLabel="캠페인 코드"
      code="L-1"
      copyLabel="복사"
    />
  );
}

describe("ChatCodeCard 썸네일", () => {
  it("이미지 로드에 실패하면 깨진 아이콘 대신 숨기고, 주소가 바뀌면 다시 보여 준다", () => {
    const { container, rerender } = render(card("https://x/broken.png"));
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    rerender(card("https://x/ok.png"));
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://x/ok.png",
    );
  });
});
