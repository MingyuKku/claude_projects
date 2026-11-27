---
paths:
  - "src/**/api/**/*.ts"
  - "src/**/model/**/*.ts"
  - "src/entities/*/lib/**/*.ts"
  - "src/features/*/lib/**/*.ts"
---

# API 연동 (OpenAPI · Zod · SWR)

## 데이터 파이프라인

OpenAPI 응답 → **Zod 검증** → 트랜스포머(뷰모델) → SWR 훅 → UI. 이 순서를 건너뛰지 않는 이유: 서버 응답은 런타임에서 타입과 다를 수 있고, UI가 raw 필드명(`first_name`)에 묶이면 API 변경이 화면 전체로 번지기 때문입니다.

## 규칙

데이터를 소유하는 슬라이스(여러 화면이 쓰는 도메인은 `entities/{domain}`, 한 기능만 쓰는 응답은 `features/{feature}`)에 아래 세그먼트로 둡니다.

- **스키마**: `model/schema.ts`에 Zod 스키마를 선언하고 `z.infer`로 타입을 얻습니다. 한 슬라이스에 응답이 여럿이라 파일이 커지면 `model/{대상}-schema.ts`로 나눕니다. 손으로 쓴 타입과 스키마를 병행하지 않습니다.
- **뷰모델 타입**: UI가 쓰는 형태(표시용 이름, 포맷된 날짜 등)는 별도 인터페이스로 스키마 옆이나 `model/types.ts`에 둡니다. `model/types.ts`는 Zod가 아닌 타입 파일입니다.
- **트랜스포머**: `lib/`의 순수 함수입니다. 스키마 타입을 받아 뷰모델을 반환하며, 기본값·포맷 처리는 여기서 합니다.
- **fetcher와 SWR 훅**: `api/`에 둡니다. fetcher는 `@/shared/api`의 HTTP 클라이언트(`serverApi`, `serverApiV3` 등)로 요청하고 검증과 변환을 끝내 뷰모델을 반환합니다. 훅의 키는 배열 튜플(`['user', id]`), 조건부 페칭은 `null` 키로 표현하며, 컴포넌트에는 뷰모델만 노출합니다.
- **명세에 없는 응답·에러 형태**는 추측하지 말고 질문합니다.

참조 코드: `src/entities/bigbird-money/` (`model/schema.ts` → `lib/transform-balance.ts` → `api/biz-money-api.ts` → `api/use-bigbird-money-balance.ts`)

낙관적 업데이트 패턴은 `state-management.md`를 따릅니다.

## 갱신(revalidation)

SWR은 캐시를 먼저 보여 주고 정해진 때에 서버에서 다시 받아 갱신합니다. 갱신하지 않는 동안은 오래된 값이 보일 수 있고, 갱신할 때마다 요청이 나갑니다.
갱신 시점은 `api/`의 훅에서 정하고, 프로젝트 기본값(`SWRProvider`)과 다르게 두면 이유는 주석에, 오래된 값이 보일 수 있는 경우는 스펙에 남기며, 요청이 나가는 때는 테스트로 고정합니다.
정할 때는 데이터를 누가 바꾸는지(이 앱인지, 관리자·다른 계정 등 밖인지)와 언제 최신이어야 하는지를 따집니다.

| 데이터 | 기본 방향 | 참조 코드 |
| :-- | :-- | :-- |
| 한 페이지만 보이는 목록, 단건 | 화면에 다시 들어올 때 갱신(기본값). 요청 1건이고 이 앱 밖의 변경도 반영됨 | `features/bigbird-money-history` `useUsageHistory` |
| 거의 바뀌지 않는 값(카테고리, 약관 등) | 화면에 다시 들어올 때·포커스 때 갱신하지 않음(`revalidateIfStale`·`revalidateOnFocus` 끔, 네트워크 재연결 때만 갱신) | `entities/campaign` `use-product-categories` |
| 페이지 번호로 받는 무한 스크롤 목록, 이 앱의 변경만 반영하면 됨 | 이 앱에서 바꿨을 때만 갱신(내용만 바뀌면 그 페이지, 항목이 생기거나 빠지면 전부) | `entities/campaign` `useCampaignScrollList` |
| 페이지 번호로 받는 무한 스크롤 목록, 이 앱 밖에서도 바뀜 | 화면에 다시 들어올 때와 다시 읽기를 요청할 때 전부 갱신(`shared/lib` `useListSync`·`useMarkListsStaleOnLeave`·`markListsStale`) | `features/bigbird-money-history` `useChargeScrollList`, `entities/subscription` `usePaymentScrollList` |
| 화면에 표시하지 않고 버튼을 누를 때만 쓰는 값 | 화면에 다시 들어올 때는 갱신하지 않고, 누를 때 필요하면 갱신 | `entities/subscription` `useSubscriptions` |
| 요청 응답에 바뀐 값이 오는 경우 | 응답으로 캐시를 고치고 갱신하지 않음(`populateCache`). 정렬·필터 목록에서 순서가 바뀔 수 있으면 갱신 | `features/manage-sub-accounts` `use-sub-account-permissions` |

페이지 번호로 받는 무한 스크롤 목록은 일부 페이지만 갱신하면 앞에 항목이 생길 때 경계가 밀려 항목이 빠지고, 전부 갱신하면 불러온 페이지 수만큼 요청이 나갑니다. 근본 해결은 커서 기반 API입니다.
무한 스크롤 목록은 `shared/lib`의 `useInfinitePages`로 만듭니다. 이 훅은 쪽 경계가 밀리지 않도록 캐시가 있으면 스스로 다시 읽지 않고(마운트·조건 전환 포함), 전역 `mutate`로도 이어 읽은 쪽을 다시 읽지 못합니다. 그래서 옵션을 넘기지 않았다고 기본값(화면에 다시 들어올 때 갱신)을 따른 것이 아니며, 쓰는 훅이 위 표에 따라 갱신 시점을 정하고 훅이 돌려주는 `reload`·`revalidatePages`로 다시 읽습니다.
