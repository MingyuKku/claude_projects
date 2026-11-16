import { createMockStore } from "./mock-store";

// 개발 서버 목의 브랜드 저장소. 브랜드 API(entities/brand)가 쓰고, 캠페인 상세 목(entities/campaign)이 브랜드명·로고를
// 이어 붙일 때 읽음. 두 슬라이스가 서로 가져올 수 없어 mock-files와 같은 이유로 shared에 둠.
// 실제 서버처럼 삭제는 표시만 해서, 결제한 캠페인은 지운 브랜드도 그대로 보여 줄 수 있음(API A-6.3).

export interface MockBrandRecord {
  brandIdx: number;
  name: string;
  imageUrl: string | null;
  isDeleted: boolean;
}

interface MockBrandDb {
  nextBrandIdx: number;
  brands: MockBrandRecord[];
}

export const mockBrandDb = createMockStore<MockBrandDb>(
  "bigbird:mock:brand-db",
  () => ({
    nextBrandIdx: 5,
    brands: [
      { brandIdx: 4, name: "비글로우", imageUrl: null, isDeleted: false },
      {
        brandIdx: 3,
        name: "빅링크 코스메틱",
        imageUrl: null,
        isDeleted: false,
      },
      { brandIdx: 2, name: "초록숲", imageUrl: null, isDeleted: false },
      {
        brandIdx: 1,
        name: "데일리 스튜디오",
        imageUrl: null,
        isDeleted: false,
      },
    ],
  }),
);
