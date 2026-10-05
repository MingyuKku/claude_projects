---
paths:
  - "src/**/api/**/*.ts"
  - "src/**/model/**/*.ts"
  - "src/**/*.ts"
---

# API 연동 (OpenAPI & Zod & SWR) 컨벤션

## 1. 데이터 파이프라인

```
OpenAPI 정의 / 엔드포인트
    ↓ (타입 안전한 Fetcher로 요청)
Raw 네트워크 응답
    ↓ (Zod 스키마 런타임 검증)
타입 보장 도메인 모델 (Entities)
    ↓ (트랜스포머 뷰모델 가공)
SWR 훅 (`useSWR`, `useSWRMutation`)
    ↓
React UI 컴포넌트
```

## 2. Zod 스키마 정의 및 타입 추론

FSD `entities/{domain}/model/types.ts`에 Zod 스키마를 선언하고 타입을 추출합니다:

```typescript
// src/entities/user/model/types.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  is_vip: z.boolean().default(false),
});

export type User = z.infer<typeof userSchema>;

// UI View Model 타입
export interface UserViewModel {
  id: string;
  fullName: string;
  avatarUrl: string;
  joinedDate: string;
  badgeText: string;
}
```

## 3. 트랜스포머 함수

```typescript
// src/entities/user/lib/transformUser.ts
import type { User, UserViewModel } from '../model/types';

export function transformUserToViewModel(user: User): UserViewModel {
  return {
    id: user.id,
    fullName: `${user.first_name} ${user.last_name}`.trim(),
    avatarUrl: user.avatar_url || '/assets/default-avatar.svg',
    joinedDate: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(user.created_at)),
    badgeText: user.is_vip ? 'VIP' : '일반',
  };
}
```

## 4. OpenAPI 클라이언트 기반 SWR 훅

```typescript
// src/entities/user/api/useUser.ts
import useSWR from 'swr';
import { apiClient } from '@/shared/api';
import { userSchema } from '../model/types';
import { transformUserToViewModel } from '../lib/transformUser';

export function useUser(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ['user', userId] : null,
    async () => {
      const response = await apiClient.getUser({ pathParams: { id: userId } });
      const validated = userSchema.parse(response);
      return transformUserToViewModel(validated);
    }
  );

  return {
    user: data,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
```
