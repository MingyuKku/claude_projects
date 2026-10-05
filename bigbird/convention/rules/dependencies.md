---
paths:
  - "package.json"
  - "src/shared/lib/**/*.ts"
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# 의존성 관리 및 회귀 방지 (Zero-Regression) 규칙

## 1. 회귀 방지 및 사이드이펙트 격리 원칙 (Blast Radius Control)

A 기능 구현 또는 리팩토링 시, 기존의 B 기능이나 다른 도메인에 예기치 않은 버그나 사이드이펙트가 발생하는 것을 원천 차단합니다.

### A. FSD 슬라이스 격리 수호
- `features/A`는 `features/B`의 내부 코드를 절대 참조할 수 없습니다.
- A 기능의 변경이 B 기능에 전파되지 않도록 상태(Zustand store), API 훅(SWR), 비즈니스 로직은 철저히 해당 슬라이스 내부(`features/A/`)에만 머물러야 합니다.

### B. 공통 계층(`shared/`, `entities/`) 수정 시 영향도 전수 조사
- `src/shared/`나 `src/entities/`의 공통 컴포넌트, 훅, 유틸, 타입을 수정할 경우:
  1. 수정 전 해당 심볼을 사용하는 모든 참조처(Consumers)를 `Grep`으로 탐색하여 영향 범위를 파악합니다.
  2. 기존 인터페이스와의 하위 호환성(Backward Compatibility)을 유지하거나 Optional Props를 활용합니다.
  3. 수정 후 영향을 받는 모든 기능의 TypeScript 컴파일 및 기존 테스트(`pnpm test`)를 반드시 재수행합니다.

### C. 최소 변경(Minimal Scoped Edits) 원칙
- 요청받은 작업과 무관한 파일의 포맷팅 변경, 불필요한 공백 추가, 임의의 리팩토링을 엄격히 금지합니다.

---

## 2. 외부 라이브러리 도입 및 충돌 방지 가이드라인

신규 패키지를 도입할 때는 다음 4단계 검증 프로세스를 반드시 거쳐야 합니다:

### 1단계: 기존 라이브러리 중복 검사 (No Duplication)
- 새로운 라이브러리를 추가하기 전, 프로젝트에 이미 설치된 도구로 해결 가능한지 먼저 확인합니다:
  - 데이터 조작/유틸 ➔ `radash`
  - 클래스 조건부 병합 ➔ `clsx`, `tailwind-merge` (`cn` 헬퍼)
  - 폼 및 스키마 유효성 검사 ➔ `react-hook-form`, `zod`
  - 아이콘 ➔ `lucide-react`
  - UI 컴포넌트 ➔ `shadcn/ui` (Radix UI)
  - 비동기 캐싱 및 뮤테이션 ➔ `swr`

### 2단계: 안정성 검증 및 버전 선정 (Stable & Battle-Tested)
- **최신 안정 버전(Stable Release)** 사용: 실험적인 알파(alpha), 베타(beta), RC(Release Candidate) 버전은 특수한 요구가 없는 한 사용하지 않습니다.
- 주간 다운로드 수, GitHub 스타, 최근 커밋 활성도를 확인하여 유지보수가 활발하고 커뮤니티에서 검증된 라이브러리만 선정합니다.

### 3단계: React 19 및 기존 의존성 충돌 검증 (Peer Dependency Check)
- 설치 전 React 19와의 피어 디펜던시(Peer Dependency) 호환성을 확인합니다.
- `pnpm add <package>` 실행 시 패키지 충돌이나 번들러 에러가 발생하는지 즉시 검증합니다.

### 4단계: 어댑터 캡슐화 (`src/shared/lib/` 래퍼)
- 외부 라이브러리를 각 컴포넌트나 피처에서 직접 임포트하지 않고, **`src/shared/lib/`에 래퍼 함수 또는 어댑터를 두어 격리**합니다.
- 이를 통해 향후 라이브러리 인터페이스가 변경되거나 다른 도구로 교체되더라도 프로젝트 전체 코드를 수정할 필요 없이 어댑터 파일 하나만 수정하여 대응할 수 있습니다.

```typescript
// ✅ 좋은 예: src/shared/lib/date.ts (외부 날짜 라이브러리를 격리 래핑)
import dayjs from 'dayjs';

export function formatDate(date: string | Date, formatStr = 'YYYY. MM. DD') {
  return dayjs(date).format(formatStr);
}
// UI 컴포넌트에서는 dayjs를 직접 임포트하지 않고 formatDate 래퍼만 사용
```
