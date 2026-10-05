---
paths:
  - "src/**/__tests__/**/*.tsx"
  - "src/**/__tests__/**/*.ts"
  - "src/**/*.test.tsx"
  - "src/**/*.test.ts"
---

# 테스트 작성 컨벤션 (Vitest + Testing Library)

## 테스트 우선순위

1. **최우선 순위 (High)**: 복잡한 비즈니스 로직, 데이터 트랜스포머, 상태 머신이 포함된 커스텀 훅.
2. **중간 순위 (Medium)**: 인터랙티브 피처 컨테이너, 폼 검증 및 제출 흐름, 에러 상태 UI.
3. **낮은 순위 (Low)**: 로직이 전혀 없는 순수 스타일 래퍼 컴포넌트.

## Vitest + React Testing Library 작성 예시

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UserCard } from '../components/UserCard';

describe('UserCard 컴포넌트', () => {
  it('사용자 정보를 정상 렌더링하고 클릭 시 onSelect 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <UserCard
        user={{
          id: 'user-1',
          displayName: '홍길동',
          displayJoinedDate: '2026. 02. 26',
        }}
        onSelect={handleSelect}
      />
    );

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    await user.click(screen.getByRole('article'));
    expect(handleSelect).toHaveBeenCalledWith('user-1');
  });
});
```
