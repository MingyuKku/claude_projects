---
paths:
  - "src/**/api/**/*.ts"
  - "src/**/model/**/*.ts"
  - "src/entities/*/lib/**/*.ts"
---

# API 연동 (OpenAPI · Zod · SWR)

## 데이터 파이프라인

OpenAPI 응답 → **Zod 검증** → 트랜스포머(뷰모델) → SWR 훅 → UI. 이 순서를 건너뛰지 않는 이유: 서버 응답은 런타임에서 타입과 다를 수 있고, UI가 raw 필드명(`first_name`)에 묶이면 API 변경이 화면 전체로 번지기 때문입니다.

## 규칙

- **스키마**: `entities/{domain}/model/types.ts`에 Zod 스키마를 선언하고 `z.infer`로 타입을 얻습니다. 손으로 쓴 타입과 스키마를 병행하지 않습니다.
- **뷰모델 타입**: UI가 쓰는 형태(표시용 이름, 포맷된 날짜 등)는 별도 `ViewModel` 인터페이스로 둡니다.
- **트랜스포머**: `entities/{domain}/lib/`의 순수 함수입니다. 스키마 타입을 받아 뷰모델을 반환하며, 기본값·포맷 처리는 여기서 합니다.
- **SWR 훅**: `entities/{domain}/api/`에 둡니다. 키는 배열 튜플(`['user', id]`), 조건부 페칭은 `null` 키로 표현합니다. 검증과 변환은 fetcher 안에서 끝내고, 컴포넌트에는 뷰모델만 노출합니다.
- **명세에 없는 응답·에러 형태**는 추측하지 말고 질문합니다.

## 표준 훅 형태

```typescript
export function useUser(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["user", userId] : null,
    async () => {
      const response = await apiClient.getUser({ pathParams: { id: userId } });
      return transformUserToViewModel(userSchema.parse(response));
    },
  );
  return { user: data, isLoading, isError: Boolean(error), mutate };
}
```

낙관적 업데이트 패턴은 `state-management.md`를 따릅니다.
