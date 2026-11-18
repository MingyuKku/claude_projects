import { openPostcodeSearch } from "./postcode";

type Options = {
  oncomplete: (data: Record<string, string>) => void;
  onclose: (state: string) => void;
};

function installDaum(behavior: (options: Options) => void) {
  window.daum = {
    Postcode: class {
      constructor(private readonly options: Options) {}
      open() {
        behavior(this.options);
      }
    } as never,
  };
}

afterEach(() => {
  delete window.daum;
});

describe("openPostcodeSearch", () => {
  it("사용자가 고른 도로명·지번 주소와 우편번호를 돌려준다", async () => {
    installDaum((options) =>
      options.oncomplete({
        zonecode: "06236",
        roadAddress: "서울 강남구 테헤란로 152",
        jibunAddress: "서울 강남구 역삼동 737",
        userSelectedType: "J",
      }),
    );

    await expect(openPostcodeSearch()).resolves.toEqual({
      zonecode: "06236",
      address: "서울 강남구 역삼동 737",
    });
  });

  it("고르지 않고 닫으면 null이다", async () => {
    installDaum((options) => options.onclose("FORCE_CLOSE"));

    await expect(openPostcodeSearch()).resolves.toBeNull();
  });

  it("스크립트를 불러오지 못하면 실패한다", async () => {
    const append = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node) => {
        (node as HTMLScriptElement).onerror?.(new Event("error"));
        return node;
      });

    await expect(openPostcodeSearch()).rejects.toThrow();
    append.mockRestore();
  });
});
