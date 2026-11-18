import { parseContentDispositionFileName } from "./content-disposition";

describe("parseContentDispositionFileName", () => {
  it("헤더가 없으면 null", () => {
    expect(parseContentDispositionFileName(null)).toBeNull();
    expect(parseContentDispositionFileName("attachment")).toBeNull();
  });

  it("따옴표가 있거나 없는 filename을 읽는다", () => {
    expect(
      parseContentDispositionFileName('attachment; filename="bank.pdf"'),
    ).toBe("bank.pdf");
    expect(
      parseContentDispositionFileName("attachment; filename=bank.pdf"),
    ).toBe("bank.pdf");
  });

  it("인코딩된 한글 이름(filename*)을 우선한다", () => {
    expect(
      parseContentDispositionFileName(
        `attachment; filename="bank.pdf"; filename*=UTF-8''%ED%86%B5%EC%9E%A5%EC%82%AC%EB%B3%B8.pdf`,
      ),
    ).toBe("통장사본.pdf");
  });

  it("잘못된 인코딩이면 일반 filename으로 대체한다", () => {
    expect(
      parseContentDispositionFileName(
        `attachment; filename="a.pdf"; filename*=UTF-8''%E0%A4%A`,
      ),
    ).toBe("a.pdf");
  });

  it("UTF-8 바이트가 Latin-1로 읽혀 깨진 한글 이름을 되살린다(자모가 풀린 이름 포함)", () => {
    // fetch가 헤더 바이트를 글자 하나씩으로 읽은 모양을 흉내 냄.
    const asLatin1 = (name: string) =>
      Array.from(new TextEncoder().encode(name), (byte) =>
        String.fromCharCode(byte),
      ).join("");
    for (const name of ["더미이미지", "더미이미지".normalize("NFD")]) {
      expect(
        parseContentDispositionFileName(
          `attachment; filename="${asLatin1(name)}"`,
        ),
      ).toBe("더미이미지");
    }
  });

  it("올바른 UTF-8이 아닌 Latin-1 이름은 그대로 둔다", () => {
    expect(parseContentDispositionFileName('attachment; filename="café"')).toBe(
      "café",
    );
  });
});
