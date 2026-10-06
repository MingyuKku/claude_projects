---
paths:
  - "package.json"
  - "src/shared/lib/**/*.ts"
---

# 의존성 관리 및 회귀 방지

## 영향 범위 통제 (Blast Radius)

한 기능의 변경이 다른 기능을 깨뜨리지 않게 합니다.

- `features/A`는 `features/B` 내부를 참조하지 않습니다. A의 상태(Zustand), 훅(SWR), 로직은 A 슬라이스 안에만 둡니다.
- `shared/`·`entities/`의 컴포넌트, 훅, 유틸, 타입을 바꿀 때는 먼저 Grep으로 소비처를 찾습니다. 하위 호환(Optional props 등)을 유지하거나 영향받는 호출부를 함께 고치고, 변경 후 `pnpm typecheck`와 `pnpm test`를 다시 실행합니다.
- 요청과 무관한 포맷 변경·리팩토링은 하지 않습니다 (최소 변경).

## 새 라이브러리 도입

도입은 사용자 확인이 필요한 결정입니다. 제안할 때 아래를 근거로 제시합니다.

1. **중복 여부**: 이미 있는 도구로 해결되는가 — 유틸 `radash`, 클래스 병합 `cn`, 폼·검증 `react-hook-form` + `zod`, 아이콘 `lucide-react`, UI `shadcn/ui`, 서버 캐시 `swr`.
2. **안정성**: 안정(stable) 릴리스인가, 유지보수가 활발한가. alpha/beta/RC는 특별한 사유가 없으면 쓰지 않습니다.
3. **호환성**: React 19 peer dependency 충돌이 없는가 (`pnpm add` 시 경고 확인).
4. **캡슐화**: 컴포넌트에서 직접 임포트하지 않고 `src/shared/lib/`의 래퍼를 거칩니다. 라이브러리를 교체할 때 래퍼 한 곳만 고치기 위해서입니다 (예: 날짜 라이브러리는 `formatDate` 래퍼 뒤에 숨김).
