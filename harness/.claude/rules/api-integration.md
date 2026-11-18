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
