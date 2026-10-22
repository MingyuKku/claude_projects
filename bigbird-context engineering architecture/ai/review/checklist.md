# bigbird AI 리뷰 체크리스트

`ai/review/criteria.md`의 영역별 점검을 구체 규칙으로 풀어 쓴 목록입니다. **원본 규칙(`AGENTS.md`, `.claude/rules/*.md`)이 우선**하며, 원본과 다르면 원본을 따르고 차이를 보고합니다. 변경과 관련된 표만 읽습니다.

심각도는 기본값입니다.

- **B**: 결함의 영향 또는 명시적 필수 규칙 위반이 확인되면 Blocker
- **R**: 권장 수정

## 1. 구조 — `architecture.md`, `api-integration.md`, `state-management.md`, `routing.md`, `styling.md`, `dependencies.md`

| 규칙 | 심각도 |
| --- | --- |
| 레이어 역류, 같은 레이어의 다른 슬라이스 임포트 (ESLint `boundaries/dependencies`가 잡으면 반복하지 않음) | B |
| 다른 슬라이스 내부 파일 직접 임포트 대신 `index.ts` 경유 | B |
| 기능 전용 상태·로직·컴포넌트를 `shared/`에 둠 | B |
| 기능 전용 변형을 `shared/ui/` 원본에 추가 (상위 컴포넌트에서 감싸야 함) | R |
| Zod 스키마는 `entities/{domain}/model/types.ts`, 트랜스포머는 `entities/{domain}/lib/`, SWR 훅은 `entities/*/api/`·`features/*/api/` | R |
| Zustand 스토어는 `features/*/model/store.ts`에 배치 | R |
| 다른 슬라이스의 Zustand 스토어를 임포트 | B |
| 슬라이스 전용 상수는 `model/constants.ts`, 공용은 `shared/config/`, 경로는 `ROUTES` | R |
| 라우트 선언은 `app/router/routes.tsx`에만, 페이지는 `lazy`로 Public API 경유 | R |
| 새 라이브러리는 `shared/lib/` 래퍼 경유 | R |

## 2. React 컴포넌트 — `code-style.md`, `react-components.md`

| 규칙 | 심각도 |
| --- | --- |
| 컴포넌트·훅은 함수 선언 (named export는 ESLint가 집행) | R |
| 이름 있는 Props 인터페이스(`UserCardProps`), 스타일을 받으면 `className` + `cn` | R |
| `forwardRef` 대신 일반 `ref` prop | R |
| 한 파일에 컴포넌트 하나 (그 파일 전용 작은 보조 컴포넌트는 허용) | R |
| 조건부 렌더링은 early return 우선, 삼항 중첩 금지 | R |
| 추가·삭제·재정렬되는 목록에서 인덱스 key → 입력·선택 상태가 다른 항목으로 이동 | B |
| 렌더 중 계산 가능한 값을 `useState`로 복제 → 원본과 어긋남 | B |
| effect로 서버 페칭·파생값 계산·이벤트 후처리·props 변경 시 state 초기화 (각각 SWR·렌더 중 계산·핸들러·`key` 리마운트) | R, 실제 버그가 있으면 B |
| 이번 변경으로 컴포넌트·훅 파일이 "책임과 크기" 기준을 넘음(무관한 책임 추가, UI가 아닌 로직이 훅 없이 본문에 쌓임). 파일 전체를 읽고 판단 | R |
| 변경된 컴포넌트·훅 파일이 300줄(공백·주석 제외, 근사)을 새로 넘었거나 이미 넘은 파일이 이번 변경으로 커짐 → 파일 전체를 읽고 위 "책임과 크기" 기준으로 판단. 줄 수만으로는 지적하지 않음(린트 결과는 전달되지 않으므로 직접 셈) | 책임이 섞였으면 R |
| 셋 이상의 항·부정이 섞인 조건에 이름이 없음, 값 목록 조건을 `!==`·`&&` 나열로 씀 | R |

## 3. 이름·타입·상수 — `code-style.md`

| 규칙 | 심각도 |
| --- | --- |
| props 이벤트는 `on + 행위 + 목적`(`onSubmitLogin`), 구현 함수는 `handle…`. 단일 요소 래퍼의 `onClick`은 예외 | R |
| boolean은 `is`/`has`/`can`/`should` | R |
| 파이프라인 이름: `userSchema` → `User` → `UserViewModel` → `transformUserToViewModel` → `useUser`/`useUserList` | R |
| 객체·Props는 `interface`, 유니온·조합은 `type` | R |
| boolean 플래그 인자로 동작을 바꾸는 함수 → 분리 또는 옵션 객체 | R |
| 커스텀 훅 반환값이 셋 이상이면 객체 | R |
| 매직 넘버·스트링, 경로 문자열 직접 사용 | R |
| 무엇을 하는지 설명하는 주석 (왜만 남김) | R |

## 4. 데이터·상태 — `api-integration.md`, `state-management.md`

| 규칙 | 심각도 |
| --- | --- |
| 응답을 `as`로 단언하거나 스키마와 별도로 수기 타입을 둠 (검증 우회) | B |
| UI가 raw API 필드(`first_name`)에 의존 | B |
| SWR 키는 배열 튜플(`['user', id]`), 결과를 구분하는 식별자·필터 포함, 조건부는 `null` 키 | 키 누락으로 다른 결과가 섞이면 B, 형식만 다르면 R |
| 검증·변환은 fetcher 안에서 끝내고 컴포넌트에는 뷰모델만 | R |
| 서버 데이터를 Zustand에 복사 | B |
| Zustand는 selector로 필요한 값만 구독, `devtools`에 스토어 이름 | R |
| 낙관적 업데이트는 `optimisticData` + `rollbackOnError` + `populateCache` | 롤백 누락이면 B |
| 상태 객체·배열 직접 변경, 부분 갱신 의도인데 통째로 덮어쓰기 | B |

SWR이 조회를 관리한다고 경쟁 검토를 생략하지 않습니다. 캐시 키 구성, SWR 데이터를 다른 state로 복사하는 흐름, mutation 뒤 캐시 연결은 계속 확인합니다.

## 5. 실행 흐름 예시 — `code-style.md`, `react-components.md`

```typescript
// 렌더마다 effect가 다시 실행된다. effect 안에서 state를 바꾸면 반복 렌더가 되므로 내부까지 확인한다.
useEffect(() => { ... }, [items.filter(isActive)]);

// 반복 렌더: 렌더 중 무조건 setState
function List() { const [count, setCount] = useState(0); setCount(count + 1); }

// 후속 코드가 완료를 전제하면 버그: forEach는 await를 기다리지 않는다
items.forEach(async (item) => { await save(item); });
navigate(ROUTES.list);
```

## 6. 라우팅·에러 — `routing.md`, `error-handling.md`

| 규칙 | 심각도 |
| --- | --- |
| framework mode 사용, `loader`/`action`으로 서버 데이터 페칭 (리다이렉트·가드 용도만 허용) | B |
| URL 상태(페이지·검색어·탭)를 `useSearchParams` 대신 로컬 state로 두어 새로고침·이동 시 유실 | B |
| 비동기 에러는 Radash `tryit` 튜플, 중첩 try/catch 지양 | R |
| 에러를 삼키고 빈 화면이나 성공 처리 | B |
| 차트·그리드·지도 같은 독립 위젯에 지역 에러 바운더리, 폴백에 재시도 | R |
| 폼 검증은 Zod, 실패 메시지는 해당 필드 근처 | 메시지가 안 보여 수정·재제출이 막히면 B |

## 7. 스타일·성능 — `styling.md`, `performance.md`

| 규칙 | 심각도 |
| --- | --- |
| 클래스 병합은 `cn`만 (`clsx`·`twMerge` 직접 사용, 문자열 삼항 조립 금지) | R |
| variant·size는 `cva`로 선언 | R |
| 시맨틱 토큰 사용, 임의 값·인라인 스타일은 Figma 근거가 있을 때만 | R |
| 디자인에 없는 스타일 추가 | R |
| 첫 렌더에 불필요한 무거운 모듈은 `React.lazy` + `Suspense` | R |
| 스크롤 아래 이미지는 `loading="lazy"`와 `width`/`height` | R |

## 8. 다국어 — `i18n.md`, `i18n-translation.md`

| 규칙 | 심각도 |
| --- | --- |
| 컴포넌트에 사용자 노출 문구 하드코딩 (테스트·개발 전용 화면 제외) | R, 새 화면이면 B |
| `ko`·`en`·`ja`·`zh-CN` 파일의 키 구성 불일치 | B |
| 다른 슬라이스의 namespace 사용 | B |
| 문장 조각 이어 붙이기, 모듈 최상단 `t()` 호출 | B |
| 언어를 넘기지 않는 `toLocale*()`, 로케일 고정 포맷 | R |
| 용어집과 다른 고유 용어 표기, 용어집에 "미정"인 용어를 확인 없이 번역 | R |
| 종류가 정해진 서버 값(상태·유형·권한·결제 수단)을 코드(enum)별 번역 키 없이 서버 문구로 표시, DB에 쌓이는 목록 값(은행명·카테고리명)을 프론트에서 번역 매핑 | R |
| 목록에 없는 서버 코드가 오면 화면이 깨짐 (서버 값을 그대로 표시해야 함) | B |

## 9. 문서·검증·생성물 — `AGENTS.md`, `CLAUDE.md`, `testing.md`, `dependencies.md`, `convention/ai/README.md`

| 규칙 | 심각도 |
| --- | --- |
| 화면(라우트) 추가·변경·삭제 시 같은 MR에서 `docs/pages.md`와 `specs/[<그룹>/]<feature>.md` 갱신 | B |
| v2(`bigbird-client-fe`) 이전 작업은 `MIGRATION.md`에 "v2 동작 → v3 결정" 기록 | R |
| 트랜스포머·상태 로직 훅·비즈니스 규칙 변경에 테스트, 버그 수정에 재현 테스트 | R, 회귀 위험이 큰 공통 로직이면 B |
| `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, 린트·Prettier·tsconfig 설정 완화로 실제 오류·검사 실패를 숨김 | B |
| 린트·Prettier·tsconfig 설정 변경의 승인 근거를 찾지 못함 | 확인 필요 (미승인 완화가 확인되면 B) |
| `shared/`·`entities/` 변경이 소비처의 타입·동작을 깨뜨림 | B |
| `AGENTS.md`·`CLAUDE.md`를 원본(`convention/ai/partials/`, `convention/ai/templates/`) 없이 직접 수정 | B (`ai-sync` job이 잡음) |
| `.claude/agents/`·`.codex/agents/`·`.agents/skills/`를 원본(`ai/agents/source/`, `ai/adapters/`, `.claude/skills/`) 없이 직접 수정 | B (`ai-sync` job이 잡음) |
| 새 라이브러리의 합의 근거를 찾지 못함 | 확인 필요 |
| `package-lock.json`·`yarn.lock` 추가, `npm`·`yarn` 명령 사용 (pnpm 프로젝트) | R |

## 10. 오탐 방지 목록

- 슬라이스 내부 상대 경로, `shared/ui/` 원본을 Figma에 맞게 직접 수정
- `console.error` 등 운영 오류 로그
- `useMemo`·`useCallback`, Actions·`useActionState`·`use()`를 쓰지 않은 것 자체
- 코드가 두 번 반복된다는 이유만의 `shared` 추출 요구
- 명세가 목 데이터로 정한 화면
- Tailwind v4 문법: 소수점 spacing(`w-161.5`), `size-*`, 뒤쪽 `!`(`text-base!`), `@custom-variant`
