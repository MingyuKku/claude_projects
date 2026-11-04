import {
  accountMasterSchema,
  subSelfAccountSchema,
} from "../model/mypage-schema";
import {
  parseServerDate,
  transformMasterToViewModel,
  transformSubSelfToViewModel,
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
  },
  companyInformation: {
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

describe("transformSubSelfToViewModel", () => {
  const subSelf = {
    accountIdx: 101,
    identifier: "sub01",
    name: "김서브",
    email: "sub01@bigbird.local",
    phone: "01011112222",
    profileImageUrl: "https://cdn.bigbird.local/sub01.png",
    created: "2026-10-28 14:05",
  };

  it("Sub 본인 정보·이미지·생성일을 읽고, 본인인증은 비운다", () => {
    expect(
      transformSubSelfToViewModel(subSelfAccountSchema.parse(subSelf)),
    ).toEqual({
      profile: {
        identifier: "sub01",
        name: "김서브",
        phone: "01011112222",
        email: "sub01@bigbird.local",
        joinedAt: new Date(2026, 9, 28, 14, 5),
        certIdx: null,
      },
      profileImageUrl: "https://cdn.bigbird.local/sub01.png",
    });
  });

  it("이미지·생성일이 없으면 null이다", () => {
    const { profile, profileImageUrl } = transformSubSelfToViewModel(
      subSelfAccountSchema.parse({
        ...subSelf,
        profileImageUrl: "",
        created: null,
      }),
    );
    expect(profileImageUrl).toBeNull();
    expect(profile.joinedAt).toBeNull();
  });
});
