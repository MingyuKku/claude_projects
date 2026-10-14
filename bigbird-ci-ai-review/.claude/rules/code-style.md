---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# 코드 스타일

React 공식 문서와 널리 쓰이는 모범 사례를 따릅니다. 포맷, import 정렬, `any`·type import, 훅 규칙, 접근성 기본 검사는 Prettier/ESLint가 집행하므로 여기에 적지 않습니다. 파일·변수·타입의 대소문자 규칙도 주변 코드를 따릅니다. 이 문서는 도구가 판단하지 못하는 규칙만 다룹니다.

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

- 컴포넌트와 훅은 함수 선언(`function`)과 named export로 씁니다. 라우터 lazy 로딩 등 도구가 default export를 요구하는 곳만 예외입니다.
- 한 파일에 컴포넌트 하나를 두고, 그 파일에서만 쓰는 작은 보조 컴포넌트는 같이 둘 수 있습니다.
- boolean props가 늘어나 조합이 복잡해지면 CVA `variant`나 합성(`children`, 슬롯)으로 바꿉니다.
- 조건부 렌더링은 이른 반환(early return)을 우선하고, 삼항을 중첩하지 않습니다. 분기가 둘 이상이면 변수나 하위 컴포넌트로 뺍니다.
- 목록의 `key`는 안정적인 id를 씁니다. 순서가 바뀌거나 항목이 추가·삭제되는 목록에서 배열 인덱스를 쓰지 않습니다.
- 로직이 두 곳 이상에서 쓰이거나 컴포넌트 본문이 읽기 어려워지면 커스텀 훅으로 뺍니다. 반환값이 둘을 넘으면 튜플이 아니라 객체로 돌려줍니다.

## 타입

- `enum`은 쓰지 않고 문자열 리터럴 유니온이나 `as const` 객체를 씁니다.
- 객체 형태와 Props는 `interface`, 유니온·조합은 `type`을 씁니다.
- 함수가 boolean 플래그 인자로 동작을 바꾸고 있으면 함수를 둘로 나누거나 옵션 객체로 받습니다.

## `useEffect`

effect는 외부 시스템과 동기화할 때(DOM API, 구독, 타이머)만 씁니다. 아래는 effect로 풀지 않습니다.

- 서버 데이터 페칭 → SWR 훅
- 다른 state에서 계산할 수 있는 값 → 렌더 중 계산
- 사용자 행동 뒤에 일어나는 일 → 이벤트 핸들러
- props가 바뀔 때 state 초기화 → `key`를 바꿔 리마운트

## 주석

코드가 무엇을 하는지가 아니라 **왜** 그렇게 했는지만 적습니다. 코드를 고쳐 설명이 필요 없어지면 주석을 지웁니다.
