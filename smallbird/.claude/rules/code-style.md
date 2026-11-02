---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# 코드 스타일

React 공식 문서와 널리 쓰이는 모범 사례를 따릅니다. 포맷, import 정렬, `any`·type import, `enum`·default export 금지, 훅 규칙, 접근성 기본 검사는 Prettier/ESLint가 집행하므로 여기에 적지 않습니다. 파일·변수·타입의 대소문자 규칙도 주변 코드를 따릅니다. 이 문서는 도구가 판단하지 못하는 규칙만 다룹니다.

## 이벤트 핸들러 이름

- props로 주고받는 이벤트는 `on + 행위 + 목적`입니다. 예: `onClickLogin`, `onChangeEmail`, `onSubmitSignup`.
- 컴포넌트 안에서 구현하는 함수는 `on`을 `handle`로 바꿉니다. 예: `handleClickLogin`. 연결은 `onClickLogin={handleClickLogin}`입니다.
- 요소 하나를 감싸는 단순 래퍼(`Button`의 `onClick`)는 목적을 붙이지 않아도 됩니다.

## 이름 패턴

- boolean은 `is`/`has`/`can`/`should`로 시작합니다. (`isLoading`, `hasError`)
- `init + 대상`(`initAuthSession`)은 렌더와 무관하게 한 번 실행되는 설정 함수에만 씁니다.
- 데이터 파이프라인 이름은 도메인명을 공유합니다.

| 대상       | 형식                           | 예                         |
| :--------- | :----------------------------- | :------------------------- |
| Zod 스키마 | `{domain}Schema`               | `userSchema`               |
| 추론 타입  | `{Domain}` (`z.infer`)         | `User`                     |
| 뷰모델     | `{Domain}ViewModel`            | `UserViewModel`            |
| 트랜스포머 | `transform{Domain}ToViewModel` | `transformUserToViewModel` |
| SWR 훅     | `use{Domain}` / `use{Domain}List` | `useUser`               |

## 상수

- 매직 넘버·매직 스트링을 코드에 직접 쓰지 않고 이름 있는 상수로 둡니다.
- 위치는 사용 범위로 정합니다. 한 슬라이스만 쓰면 그 슬라이스의 `model/constants.ts`, 여러 슬라이스가 쓰면 `shared/config/`, 라우트 경로는 `ROUTES`(`routing.md`)입니다.
- 다른 슬라이스의 상수가 필요해지면 임포트하지 말고 `shared/config/`로 올릴지 판단합니다. (슬라이스 격리)
- 한 파일에서만 쓰는 작은 값은 그 파일 상단에 둡니다.

## 컴포넌트와 훅

- 컴포넌트와 훅은 함수 선언(`function`)으로 씁니다. export는 named export만 씁니다(ESLint). 도구가 default export를 요구하는 파일은 `eslint.config.js`에 그 파일만 예외로 둡니다.
- 한 파일에 컴포넌트 하나를 두고, 그 파일에서만 쓰는 작은 보조 컴포넌트는 같이 둘 수 있습니다.
- boolean props가 늘어나 조합이 복잡해지면 CVA `variant`나 합성(`children`, 슬롯)으로 바꿉니다.
- 조건부 렌더링은 이른 반환(early return)을 우선하고, 삼항을 중첩하지 않습니다. 분기가 둘 이상이면 변수나 하위 컴포넌트로 뺍니다.
- 목록의 `key`는 안정적인 id를 씁니다. 순서가 바뀌거나 항목이 추가·삭제되는 목록에서 배열 인덱스를 쓰지 않습니다.
- 커스텀 훅으로 빼는 기준은 `react-components.md` "로직과 렌더링의 분리"를 따릅니다. 반환값이 둘을 넘으면 튜플이 아니라 객체로 돌려줍니다.

## 본문 순서

컴포넌트 본문은 위에서 아래로 읽히게 다음 순서로 묶습니다.

1. 훅 호출(`useTranslation`, 상태, 스토어, 커스텀 훅)
2. 파생 값(렌더 중 계산)
3. 이벤트 핸들러(`handle*`)
4. `return`(렌더)

묶음 사이와 관련 없는 문장 사이에는 빈 줄을 둡니다. 함수 선언 앞뒤의 빈 줄은 ESLint(`@stylistic/padding-line-between-statements`)가 교정합니다. 훅과 핸들러가 번갈아 나오면 순서를 다시 정리할 신호입니다.

## 조건에 이름 붙이기

- 셋 이상의 항을 `&&`·`||`로 잇거나 부정이 섞인 조건은 의미를 담은 이름의 변수나 함수로 뺍니다(`const isAllowedRoute = ...`).
- 허용·차단 목록처럼 값 목록으로 표현되는 조건은 `a !== X && a !== Y && ...`로 나열하지 않고 상수 배열·`Set`과 `includes`·`has`로 씁니다.

## 타입

- 객체 형태와 Props는 `interface`, 유니온·조합은 `type`을 씁니다.
- 함수가 boolean 플래그 인자로 동작을 바꾸고 있으면 함수를 둘로 나누거나 옵션 객체로 받습니다.

## `useEffect`

effect는 외부 시스템과 동기화할 때(DOM API, 구독, 타이머)만 씁니다. 아래는 effect로 풀지 않습니다.

- 서버 데이터 페칭 → SWR 훅
- 다른 state에서 계산할 수 있는 값 → 렌더 중 계산
- 사용자 행동 뒤에 일어나는 일 → 이벤트 핸들러
- props가 바뀔 때 state 초기화 → `key`를 바꿔 리마운트

## 주석

코드가 무엇을 하는지가 아니라 **왜** 그렇게 했는지만 적습니다. 코드를 고쳐 설명이 필요 없어지면 주석을 지웁니다. 이름과 코드만으로 의도가 읽히면 주석을 달지 않고, 달 때도 한두 줄로 씁니다.

말투는 존댓말(`~합니다`, `~입니다`)을 쓰지 않고, 명사형 종결(`~함`, `~임`)로 짧게 씁니다. 과거형(`~했음`, `~었음`) 대신 현재형(`~함`, `~음`)으로 쓰고, 문장 흐름상 없어도 읽히면 `~임`도 생략합니다(`때문임` → `때문`, `0.4129 임` → `0.4129`). 예: `// 서버가 1분이 지나도 성공으로 답하므로 만료는 여기서 판단함`, `// 폭 361 에서는 베이지색 띠가 오른쪽 4px 에 비침`, `/** 플랫폼 로고(기본 24px) */`
