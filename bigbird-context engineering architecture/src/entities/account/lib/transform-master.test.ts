import { accountMasterSchema } from "../model/mypage-schema";
import {
  parseServerDate,
  transformMasterToViewModel,
} from "./transform-master";

const masterResponse = {
  result: true,
  user: {
    identifier: "advertiser01",
    email: "advertiser01@example.com",
    certification: {
      certIdx: 87,
      name: "홍길동",
      phoneNumber: "01012345678",
    },
    created: "2019-10-18 01:19",
    idKakao: "kakao-1",
    emailKakao: "k@example.com",
    idNaver: null,
    emailNaver: null,
  },
  extraInformation: {
    companyName: "주식회사 빅버드",
    contact: "01012345678",
    companyRegistrationNumber: "123-45-67890",
    mailorderBusinessNumber: "2024-서울강남-1234",
    companyClassification: 3,
    companyClassificationName: "패션/의류",
    companyRegistrationFileNum: 501,
    companyRegistrationFileName: "사업자등록증.pdf",
    mailorderBusinessFileNum: null,
    bankBookFileNum: null,
    companyUrl: "https://bigbird.co.kr",
  },
};

describe("transformMasterToViewModel", () => {
  it("본인인증 정보를 담당자명·휴대폰으로 옮기고 가입일을 Date로 바꾼다", () => {
    const { profile } = transformMasterToViewModel(
      accountMasterSchema.parse(masterResponse),
    );
    expect(profile).toMatchObject({
      identifier: "advertiser01",
      name: "홍길동",
      phone: "01012345678",
      email: "advertiser01@example.com",
      certIdx: 87,
    });
    expect(profile.joinedAt?.getFullYear()).toBe(2019);
  });

  it("연동 ID가 있으면 연동됨, null이면 연동 안 됨으로 본다", () => {
    const { socialLinks } = transformMasterToViewModel(
      accountMasterSchema.parse(masterResponse),
    );
    expect(socialLinks.kakao).toEqual({
      isLinked: true,
      email: "k@example.com",
    });
    expect(socialLinks.naver).toEqual({ isLinked: false, email: null });
    // 응답에 키가 아예 없는 SNS도 연동 안 됨으로 본다.
    expect(socialLinks.facebook.isLinked).toBe(false);
  });

  it("서류는 인덱스가 아니라 등록 여부와 파일명으로 바꾼다", () => {
    const { company } = transformMasterToViewModel(
      accountMasterSchema.parse(masterResponse),
    );
    expect(company).toMatchObject({
      companyName: "주식회사 빅버드",
      categoryIdx: 3,
      hasBusinessRegistrationFile: true,
      businessRegistrationFileName: "사업자등록증.pdf",
      hasMailorderFile: false,
      mailorderFileName: null,
      hasBankBookFile: false,
    });
  });

  it("회사정보가 없으면 company는 null이다", () => {
    const { company, profile } = transformMasterToViewModel(
      accountMasterSchema.parse({
        result: true,
        user: { identifier: "a1b2c3" },
      }),
    );
    expect(company).toBeNull();
    expect(profile).toMatchObject({ name: "", phone: "", certIdx: null });
  });
});

describe("parseServerDate", () => {
  it("빈 값이나 잘못된 값은 null이다", () => {
    expect(parseServerDate(null)).toBeNull();
    expect(parseServerDate("")).toBeNull();
    expect(parseServerDate("not a date")).toBeNull();
  });
});
