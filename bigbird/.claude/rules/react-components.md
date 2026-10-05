---
paths:
  - "src/**/components/**/*.tsx"
  - "src/**/*.tsx"
---

# React 컴포넌트 설계 및 모범 사례

## 1. 명시적 Props 인터페이스 정의

모든 컴포넌트에는 명시적인 `Props` 인터페이스를 선언하십시오. 인라인 익명 타입을 지양합니다:

```tsx
// ✅ 좋은 예
interface UserCardProps {
  user: TransformedUserData;
  onSelect?: (userId: string) => void;
  className?: string;
}

export function UserCard({ user, onSelect, className }: UserCardProps) {
  return (
    <article className={clsx("rounded-2xl p-4 transition-all hover:shadow-lg", className)}>
      <h3>{user.displayName}</h3>
    </article>
  );
}
```

## 2. 프레젠테이션 vs 컨테이너 분리

- **컨테이너 / 페이지 컴포넌트**: 데이터 페칭(`useQuery`), 스토어 연동, 이벤트 핸들링 조율 후 하위 컴포넌트로 데이터 전달.
- **프레젠테이션 컴포넌트**: Props에만 의존하는 순수 함수 컴포넌트. 직접적인 네트워크 호출이 없으므로 테스트 및 스토리북 작성이 용이함.

## 3. React 19 최신 패턴

- **Actions 및 useActionState**: 폼 제출 및 뮤테이션 처리에 최신 React 19 액션 훅을 우선 사용.
- **use() 훅**: 비동기 데이터나 Context 구독 시 장황한 래퍼 대신 `use(Promise)` / `use(Context)` 활용.
- **Direct ref 전달**: React 19에서는 `forwardRef` 보일러플레이트 없이 일반 prop으로 `ref` 직접 전달 가능.

## 4. 지양해야 할 안티패턴

- ❌ Props 또는 상태에 `any` 타입 사용 금지.
- ❌ 트랜스포머 없이 raw API 페이로드를 UI 컴포넌트 prop으로 직접 주입 금지.
- ❌ 상태 직접 변경(Mutation) 및 계산 가능한 파생 상태를 불필요하게 `useState`로 복제 금지.
- ❌ 400줄 이상의 거대 단일 컴포넌트 지양 (작은 하위 컴포넌트로 분할).
