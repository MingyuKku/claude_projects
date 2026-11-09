import { openPostcodeSearch } from "./postcode";

type Options = ConstructorParameters<
  NonNullable<Window["daum"]>["Postcode"]
>[0];

let options: Options | undefined;

function installDaum() {
  window.daum = {
    Postcode: class {
      constructor(opts: Options) {
        options = opts;
      }
      open() {}
    },
  };
}

afterEach(() => {
  delete window.daum;
  options = undefined;
  document.head.querySelectorAll("script").forEach((el) => el.remove());
});

describe("openPostcodeSearch", () => {
  it("도로명을 고르면 도로명 주소와 우편번호를 돌려준다", async () => {
    installDaum();

    const result = openPostcodeSearch();
    await vi.waitFor(() => expect(options).toBeDefined());
    options?.oncomplete({
      zonecode: "06236",
      roadAddress: "서울 강남구 테헤란로 1",
      jibunAddress: "서울 강남구 역삼동 1",
      userSelectedType: "R",
    });

    await expect(result).resolves.toEqual({
      zonecode: "06236",
      address: "서울 강남구 테헤란로 1",
    });
  });

  it("지번을 고르면 지번 주소를 돌려준다", async () => {
    installDaum();

    const result = openPostcodeSearch();
    await vi.waitFor(() => expect(options).toBeDefined());
    options?.oncomplete({
      zonecode: "06236",
      roadAddress: "서울 강남구 테헤란로 1",
      jibunAddress: "서울 강남구 역삼동 1",
      userSelectedType: "J",
    });

    await expect(result).resolves.toMatchObject({
      address: "서울 강남구 역삼동 1",
    });
  });

  it("고르지 않고 닫으면 undefined를 돌려준다", async () => {
    installDaum();

    const result = openPostcodeSearch();
    await vi.waitFor(() => expect(options).toBeDefined());
    options?.onclose?.();

    await expect(result).resolves.toBeUndefined();
  });

  it("스크립트를 불러오지 못하면 거절하고, 다시 열면 다시 불러온다", async () => {
    const failed = openPostcodeSearch();
    document.head.querySelector("script")?.dispatchEvent(new Event("error"));
    await expect(failed).rejects.toThrow();

    const retried = openPostcodeSearch().catch(() => undefined);
    expect(document.head.querySelectorAll("script")).toHaveLength(1);
    document.head.querySelector("script")?.dispatchEvent(new Event("error"));
    await retried;
  });
});
