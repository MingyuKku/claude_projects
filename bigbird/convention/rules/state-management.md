---
paths:
  - "src/**/model/**/*.ts"
  - "src/**/hooks/**/*.ts"
  - "src/**/*.ts"
---

# 상태 관리 (Zustand) 및 데이터 페칭 (SWR) 컨벤션

## 1. 상태 분류 및 전담 도구

| 상태 분류 | 전담 라이브러리 | 적용 위치 및 예시 |
| :--- | :--- | :--- |
| **로컬 UI 상태** | `useState` / `useReducer` | 모달 열림/닫힘, 드롭다운 토글, 인풋 포커스 |
| **글로벌 클라이언트 UI 상태** | `Zustand` | `features/*/model/store.ts` (인증 세션, 사이드바, 필터, 테마) |
| **비동기 데이터 & 서버 캐시** | `SWR` (`useSWR`, `useSWRMutation`) | `entities/*/api/`, `features/*/api/` (API 응답 캐싱, Optimistic UI) |
| **URL 파라미터 상태** | 라우터 query / searchParams | 페이지네이션, 검색어, 활성 탭 인덱스 |

## 2. Zustand 스토어 작성 패턴

FSD의 `model/store.ts` 또는 `model/{storeName}.ts`에 배치합니다:

```typescript
// src/features/filter-products/model/store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FilterState {
  searchQuery: string;
  selectedCategoryId: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: string | null) => void;
  reset: () => void;
}

export const useProductFilterStore = create<FilterState>()(
  devtools(
    (set) => ({
      searchQuery: '',
      selectedCategoryId: null,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
      reset: () => set({ searchQuery: '', selectedCategoryId: null }),
    }),
    { name: 'ProductFilterStore' }
  )
);
```

## 3. SWR 커스텀 훅 및 캐시 갱신 패턴

FSD의 `api/` 또는 `model/`에 SWR 훅을 캡슐화합니다:

```typescript
// src/entities/user/api/useUser.ts
import useSWR from 'swr';
import { fetchUserById } from './client';
import { userSchema, type User } from '../model/types';

export function useUser(userId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    userId ? `/api/v1/users/${userId}` : null,
    async (url: string) => {
      const raw = await fetchUserById(userId!);
      return userSchema.parse(raw); // Zod 런타임 검증
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000 * 60, // 1분간 중복 요청 방지
    }
  );

  return {
    user: data as User | undefined,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
```

## 4. SWR 낙관적 업데이트 (Optimistic UI)

데이터 변경 시 사용자 반응 속도를 극대화하기 위해 낙관적 업데이트를 적용합니다:

```typescript
// src/features/like-post/model/useLikePost.ts
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';

export async function toggleLikePost(url: string, { arg }: { arg: { postId: string } }) {
  // 1. 즉시 캐시 선반영 (Optimistic)
  await mutate(
    `/api/v1/posts/${arg.postId}`,
    (current: any) => ({ ...current, isLiked: !current?.isLiked, likesCount: current?.likesCount + 1 }),
    false // 서버 재검증 보류
  );

  // 2. 실제 API 호출
  const updated = await apiClient.postLike(arg.postId);

  // 3. 서버 응답으로 캐시 확정
  await mutate(`/api/v1/posts/${arg.postId}`, updated, true);
}
```
