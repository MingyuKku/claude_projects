---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Feature-Sliced Design (FSD) 아키텍처 규칙

`bigbird` 프로젝트는 **Feature-Sliced Design (FSD v2.1)** 방법론을 엄격히 준수합니다.

## 1. 계층 구조 (Layers Hierarchy)

```
src/
├── app/         # 전역 설정, 프로바이더, 라우팅 초기화, 글로벌 스타일
├── pages/       # 라우트 단위 페이지 컴포넌트 (라우팅 뷰 조립)
├── widgets/     # 독립적으로 완결된 대형 UI 블록 (예: Header, Sidebar, ProductFeed)
├── features/    # 사용자 인터랙션 및 비즈니스 가치 단위 (예: AuthByEmail, AddToCart, FilterItems)
├── entities/    # 비즈니스 핵심 도메인 모델 및 기본 UI (예: User, Product, Order)
└── shared/      # 도메인 비종속적 공통 재사용 모듈 (shadcn/ui, API 클라이언트, 유틸, 훅)
```

## 2. 엄격한 단방향 의존성 규칙 (Dependency Rules)

```
app ──> pages ──> widgets ──> features ──> entities ──> shared
```

- 위 레이어는 아래 레이어만 임포트합니다. 중간 레이어를 건너뛰는 것은 허용합니다(`pages` → `entities`). `app`은 모든 레이어를 임포트할 수 있습니다.
- 같은 레이어의 다른 슬라이스는 임포트하지 않습니다(`features/a` → `features/b` 금지). 공유가 필요하면 아래 레이어로 내립니다.
- `shared`는 외부 라이브러리와 `shared` 내부만 임포트합니다.

## 3. 슬라이스 내부 세그먼트 구성 (Slice Segments)

각 슬라이스(`widgets/*`, `features/*`, `entities/*`)는 다음 표준 세그먼트로 구성됩니다:

```
src/{layer}/{slice}/
├── ui/              # 프레젠테이션 React 컴포넌트
├── model/           # Zustand 스토어, Zod 스키마, 비즈니스 로직
├── api/             # OpenAPI 연동 엔드포인트, Fetcher, SWR 훅
├── lib/             # 슬라이스 전용 유틸리티 및 헬퍼
└── index.ts         # [Public API] 외부로 공개할 컴포넌트, 훅, 타입만 선별적 re-export
```

## 4. Public API 원칙

- 외부 레이어는 항상 슬라이스의 `index.ts`를 통해서만 임포트해야 합니다.
- ❌ **나쁜 예**: `import { UserCard } from '@/entities/user/ui/UserCard'`
- ✅ **좋은 예**: `import { UserCard } from '@/entities/user'`

## 5. 린트 강제

위 의존성 규칙과 Public API 원칙은 문서가 아니라 ESLint(루트 `eslint.config.js`)가 집행합니다.

- 레이어 역류와 같은 레이어의 다른 슬라이스 임포트: `boundaries/dependencies`
- 다른 슬라이스의 내부 세그먼트 직접 임포트(`@/entities/user/model/types`): `no-restricted-imports`
- `entities` 간 `@x` 참조 같은 예외가 필요하면 팀 합의 후 설정의 `LAYERS` 표에 추가합니다.

규칙을 바꿀 때는 이 문서와 `eslint.config.js`를 함께 고칩니다. 위반이 보고되면 린트를 끄지 말고 레이어 구조를 고칩니다.
