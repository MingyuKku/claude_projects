import {
  buildMailorderNumber,
  checkStatusMessage,
  classifyFileSize,
  digitsOnly,
  emailFormatSchema,
  ID_HINT,
  idFormatSchema,
  isAllowedUploadExtension,
  isContinuedValue,
  isDeniedId,
  isValidCompanyUrl,
  isValidEmailFormat,
  isValidIdFormat,
  mapValidPasswordError,
  normalizeCompanyUrl,
  PASSWORD_HINT,
  validatePassword,
} from "./join-validation";

describe("isValidIdFormat", () => {
  it("영문·숫자·밑줄·점 6~20자 통과", () =>
    expect(isValidIdFormat("user_1.2")).toBe(true));
  it("6자 미만 거부", () => expect(isValidIdFormat("abc")).toBe(false));
  it("허용되지 않은 문자 거부", () =>
    expect(isValidIdFormat("user!name")).toBe(false));
});

describe("isDeniedId", () => {
  it("금지어를 포함하면 거부", () => expect(isDeniedId("myadmin")).toBe(true));
  it("대소문자 무관하게 거부", () => expect(isDeniedId("MyAdmin")).toBe(true));
  it("멀쩡한 아이디는 통과", () => expect(isDeniedId("hong1234")).toBe(false));
});

describe("isValidEmailFormat", () => {
  it("통과", () => expect(isValidEmailFormat("a.b@c.com")).toBe(true));
  it("최상위 도메인이 없으면 거부", () =>
    expect(isValidEmailFormat("a@b")).toBe(false));
});

describe("isContinuedValue", () => {
  it("오름차순 4연속 탐지", () =>
    expect(isContinuedValue("ab1234cd")).toBe(true));
  it("내림차순 4연속 탐지", () =>
    expect(isContinuedValue("zk4321")).toBe(true));
  it("3연속은 통과 — 경계값", () =>
    expect(isContinuedValue("ab123x")).toBe(false));
  it("연속이 없으면 통과", () =>
    expect(isContinuedValue("a1b3c5")).toBe(false));
});

describe("validatePassword", () => {
  it("조건을 모두 만족하면 null", () =>
    expect(validatePassword("Abc12!@x", "hong1234")).toBeNull());
  it("형식 미달은 안내 문구", () =>
    expect(validatePassword("abc", "hong1234")).toBe(PASSWORD_HINT));
  it("아이디를 포함하면 거부", () =>
    expect(validatePassword("hong1234!Ab", "hong1234")).toBe(
      "아이디를 포함한 비밀번호 불가",
    ));
  it("같은 문자 4회 반복은 거부", () =>
    expect(validatePassword("Aaaa1!bc", "hong1234")).toBe(
      "동일∙연속적 숫자,문자 반복 불가",
    ));
});

describe("isValidCompanyUrl", () => {
  it("선택 입력이라 빈 값은 통과", () =>
    expect(isValidCompanyUrl("")).toBe(true));
  it("도메인 형식이면 통과", () =>
    expect(isValidCompanyUrl("http://biglinkai.com")).toBe(true));
  it("형식이 아니면 거부", () =>
    expect(isValidCompanyUrl("not a url")).toBe(false));
});

describe("normalizeCompanyUrl", () => {
  it("스킴이 없으면 http:// 를 붙인다", () =>
    expect(normalizeCompanyUrl("biglinkai.com")).toBe("http://biglinkai.com"));
  it("이미 있으면 그대로 둔다", () =>
    expect(normalizeCompanyUrl("https://biglinkai.com")).toBe(
      "https://biglinkai.com",
    ));
  it("50자에서 자른다", () =>
    expect(normalizeCompanyUrl(`http://${"a".repeat(60)}`)).toHaveLength(50));
});

describe("digitsOnly", () => {
  it("숫자만 남기고 길이로 자른다", () =>
    expect(digitsOnly("02-1234-abcd5678", 10)).toBe("0212345678"));
});

describe("buildMailorderNumber", () => {
  it("지역이 없는 신고번호", () =>
    expect(buildMailorderNumber(["2024", "", "123"])).toBe("2024-123"));
  it("한글 지역이 있는 신고번호", () =>
    expect(buildMailorderNumber(["2024", "서울", "123"])).toBe(
      "2024-서울-123",
    ));
  it("한글이 아닌 지역은 없는 것으로 본다", () =>
    expect(buildMailorderNumber(["2024", "seoul", "123"])).toBe("2024-123"));
  it("연도가 4자리가 아니면 null", () =>
    expect(buildMailorderNumber(["202", "", "123"])).toBeNull());
  it("일련번호가 1자리면 null — 경계값", () =>
    expect(buildMailorderNumber(["2024", "", "1"])).toBeNull());
  it("일련번호가 5자리면 통과 — 경계값", () =>
    expect(buildMailorderNumber(["2024", "", "12345"])).toBe("2024-12345"));
});

describe("isAllowedUploadExtension", () => {
  it("pdf 허용", () =>
    expect(isAllowedUploadExtension("license.pdf")).toBe(true));
  it("대문자 확장자도 허용", () =>
    expect(isAllowedUploadExtension("license.PDF")).toBe(true));
  it("exe 거부", () =>
    expect(isAllowedUploadExtension("virus.exe")).toBe(false));
});

describe("classifyFileSize", () => {
  it("1KB 미만은 바이트", () =>
    expect(classifyFileSize(500)).toEqual({
      label: "500Bytes",
      tooLarge: false,
    }));
  it("1MB 미만은 KB", () =>
    expect(classifyFileSize(2048)).toEqual({ label: "2KB", tooLarge: false }));
  it("5MB 를 넘으면 표시한다", () =>
    expect(classifyFileSize(6 * 1024 * 1024).tooLarge).toBe(true));
  it("5MB 정확히는 통과 — 경계값", () =>
    expect(classifyFileSize(5 * 1024 * 1024).tooLarge).toBe(false));
});

describe("checkStatusMessage", () => {
  it("중복이면 사용중 안내", () =>
    expect(checkStatusMessage("wrong", "아이디")).toBe(
      "이미 사용중인 아이디입니다",
    ));
  it("가능하면 사용 가능 안내", () =>
    expect(checkStatusMessage("possible", "이메일")).toBe(
      "사용 가능한 이메일입니다",
    ));
  it("확인이 필요하면 안내", () =>
    expect(checkStatusMessage("needCheck", "아이디")).toBe(
      "아이디 중복확인이 필요합니다",
    ));
  it("idle 은 빈 문자열", () =>
    expect(checkStatusMessage("idle", "아이디")).toBe(""));
});

describe("mapValidPasswordError", () => {
  it("maps known reasons", () => {
    expect(mapValidPasswordError("contains id")).toBe(
      "아이디를 포함한 비밀번호 불가",
    );
    expect(mapValidPasswordError("contains personal info")).toBe(
      "개인정보 포함한 비밀번호 불가",
    );
  });
  it("falls back for unknown reasons", () =>
    expect(mapValidPasswordError()).toBe(
      "비밀번호를 변경할 수 없습니다 조건을 다시 한번더 확인해주세요",
    ));
});

describe("format schemas", () => {
  it("carry the user-facing hint as the error message", () => {
    expect(idFormatSchema.safeParse("a").error?.issues[0]?.message).toBe(
      ID_HINT,
    );
    expect(emailFormatSchema.safeParse("a@b").error?.issues[0]?.message).toBe(
      "올바른 이메일 형식이 아닙니다.",
    );
  });
});
