import { resolveBrand } from "./brand";

describe("resolveBrand", () => {
  it("petplay 도메인이면 펫플레이 테마", () => {
    const brand = resolveBrand("member.petplay.co.kr");
    expect(brand.loginTitle).toBe("펫플레이 파트너센터 로그인");
    expect(brand.primaryColor).toBe("#f79000");
    expect(brand.showQuestion).toBe(false);
  });

  it("그 밖의 도메인은 빅버드 테마", () => {
    const brand = resolveBrand("client.bigbird.co.kr");
    expect(brand.loginTitle).toBe("빅버드 파트너센터 로그인");
    expect(brand.primaryColor).toBeNull();
    expect(brand.showQuestion).toBe(true);
  });

  it("서브도메인이 붙어도 키워드로 판별한다", () => {
    expect(resolveBrand("stage.member.petplay.co.kr").primaryColor).toBe(
      "#f79000",
    );
  });

  it("QA 용 ?brand=petplay 로 강제 전환한다", () => {
    expect(resolveBrand("localhost", "?brand=petplay").primaryColor).toBe(
      "#f79000",
    );
    expect(resolveBrand("localhost", "?brand=bigbird").primaryColor).toBeNull();
  });
});
