import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThumbnailUpload } from "./ThumbnailUpload";

function setup(imageUrl?: string) {
  const onPickFile = vi.fn();
  const onRemove = vi.fn();
  const { container } = render(
    <>
      <span id="label">브랜드 이미지</span>
      <ThumbnailUpload
        aria-labelledby="label"
        imageUrl={imageUrl}
        title="이미지를 올려 주세요."
        description="안내"
        accept="image/png,image/jpeg"
        removeLabel="삭제"
        onPickFile={onPickFile}
        onRemove={onRemove}
      />
    </>,
  );
  const input = container.querySelector("input[type=file]") as HTMLInputElement;
  return { onPickFile, onRemove, input, user: userEvent.setup() };
}

describe("ThumbnailUpload", () => {
  it("비어 있으면 안내 문구를 보이고 삭제 버튼은 없다", () => {
    setup();

    expect(screen.getByText("이미지를 올려 주세요.")).toBeInTheDocument();
    expect(screen.getByText("안내")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });

  it("누르면 파일 선택을 열고, 고른 파일을 넘긴다", async () => {
    const { input, onPickFile, user } = setup();
    const click = vi.spyOn(input, "click");
    const file = new File(["x"], "a.png", { type: "image/png" });

    await user.click(screen.getByRole("button", { name: "브랜드 이미지" }));
    await user.upload(input, file);

    expect(click).toHaveBeenCalled();
    expect(onPickFile).toHaveBeenCalledWith(file);
  });

  it("이미지가 있으면 미리보기를 채우고 삭제할 수 있다", async () => {
    const { onRemove, user } = setup("blob:preview");

    expect(document.querySelector("img")).toHaveAttribute(
      "src",
      "blob:preview",
    );
    expect(screen.queryByText("이미지를 올려 주세요.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("미리보기를 다시 누르면 파일을 다시 고른다", async () => {
    const { input, user } = setup("blob:preview");
    const click = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button", { name: "브랜드 이미지" }));

    expect(click).toHaveBeenCalled();
  });
});
