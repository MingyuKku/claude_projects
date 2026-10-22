import { checkAttachments, getAttachmentKind } from "./attachment-rules";

const MB = 1024 * 1024;
const file = (name: string, size = 1) => ({ name, size });

describe("getAttachmentKind", () => {
  it("확장자로 이미지·동영상을 가르고 대소문자를 구분하지 않는다", () => {
    expect(getAttachmentKind(file("a.PNG"))).toBe("image");
    expect(getAttachmentKind(file("a.webp"))).toBe("image");
    expect(getAttachmentKind(file("a.mp4"))).toBe("video");
  });

  it("허용하지 않는 형식과 확장자 없는 파일은 null이다", () => {
    expect(getAttachmentKind(file("a.gif"))).toBeNull();
    expect(getAttachmentKind(file("a.mov"))).toBeNull();
    expect(getAttachmentKind(file("noext"))).toBeNull();
  });
});

describe("checkAttachments", () => {
  it("허용 범위 안이면 null이다", () => {
    expect(
      checkAttachments([], [file("a.jpg", 30 * MB), file("b.mp4", 50 * MB)]),
    ).toBeNull();
  });

  it("형식·용량이 어긋나면 해당 오류를 돌려준다", () => {
    expect(checkAttachments([], [file("a.gif")])).toBe("format");
    expect(checkAttachments([], [file("a.jpg", 30 * MB + 1)])).toBe(
      "imageSize",
    );
    expect(checkAttachments([], [file("a.mp4", 50 * MB + 1)])).toBe(
      "videoSize",
    );
  });

  it("이미 담긴 파일까지 합쳐 전체 10개를 넘으면 막는다", () => {
    const images = Array.from({ length: 10 }, (_, i) => file(`${i}.png`));
    expect(checkAttachments(images, [file("x.png")])).toBe("imageCount");
    // 이미지와 동영상을 섞어도 합계로 센다.
    expect(checkAttachments(images, [file("x.mp4")])).toBe("imageCount");
    const mixed = [
      ...Array.from({ length: 8 }, (_, i) => file(`${i}.png`)),
      ...Array.from({ length: 3 }, (_, i) => file(`${i}.mp4`)),
    ];
    expect(checkAttachments([], mixed)).toBe("imageCount");
    expect(checkAttachments([], mixed.slice(0, 10))).toBeNull();
  });

  it("동영상은 합계와 별개로 5개까지다", () => {
    const videos = Array.from({ length: 5 }, (_, i) => file(`${i}.mp4`));
    expect(checkAttachments([], videos)).toBeNull();
    expect(checkAttachments(videos, [file("x.mp4")])).toBe("videoCount");
  });

  it("한 번에 고른 파일이 하나라도 걸리면 첫 오류를 돌려준다", () => {
    expect(checkAttachments([], [file("ok.png"), file("bad.gif")])).toBe(
      "format",
    );
  });
});
