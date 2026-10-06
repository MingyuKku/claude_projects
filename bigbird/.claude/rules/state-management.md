---
paths:
  - "src/**/model/**/*.ts"
  - "src/**/api/**/*.ts"
---

# 상태 관리 (Zustand · SWR)

## 상태 분류

| 상태                                    | 도구                      | 위치                                 |
| :-------------------------------------- | :------------------------ | :----------------------------------- |
| 로컬 UI (모달, 포커스)                  | `useState` / `useReducer` | 컴포넌트                             |
| 글로벌 클라이언트 UI (세션, 필터, 테마) | Zustand                   | `features/*/model/store.ts`          |
| 서버 데이터 · 캐시                      | SWR                       | `entities/*/api/`, `features/*/api/` |
| URL 상태 (페이지, 검색어, 탭)           | router searchParams       | 페이지                               |

서버 데이터를 Zustand에 복사하지 않습니다. 원본은 SWR 캐시이고, 복사본은 반드시 어긋납니다.

## Zustand

- 스토어는 슬라이스 내부(`model/`)에 둡니다. 다른 슬라이스의 스토어를 임포트하지 않습니다(슬라이스 격리).
- 액션은 상태와 같은 스토어에 정의하고, 컴포넌트에서는 필요한 값만 selector로 구독합니다.
- `devtools`에는 스토어 이름을 지정합니다.

## SWR

훅 구현과 키 규칙은 `api-integration.md`를 따릅니다.

## 낙관적 업데이트

`useSWRMutation`의 `optimisticData` + `rollbackOnError`를 씁니다. 실패 시 자동 롤백되고, 응답으로 캐시를 확정합니다.

```typescript
useSWRMutation(["post", postId], () => apiClient.postLike(postId), {
  optimisticData: (current?: Post) =>
    current && {
      ...current,
      isLiked: !current.isLiked,
      likesCount: current.likesCount + (current.isLiked ? -1 : 1),
    },
  rollbackOnError: true,
  populateCache: (updated: Post) => updated,
  revalidate: false,
});
```
