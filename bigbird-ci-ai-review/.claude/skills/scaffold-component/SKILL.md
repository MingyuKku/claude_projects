---
name: scaffold-component
description: FSD 구조에 맞는 새 React 컴포넌트(또는 슬라이스)를 만들 때 사용합니다. 레이어·슬라이스 결정, ui/ 세그먼트 배치, Public API(index.ts) 노출, 테스트 작성까지 다룹니다.
---

# FSD 컴포넌트 스캐폴딩

대상: 사용자가 지정한 레이어/슬라이스와 컴포넌트 이름 (지정이 없으면 질문)

1. **위치 확정**: 레이어와 슬라이스를 정합니다. 불명확하면 추측하지 말고 질문하거나 `architect` 에이전트(없으면 직접) 기준으로 제안합니다. 컴포넌트는 `src/{layer}/{slice}/ui/{ComponentName}.tsx`에 둡니다.
2. **기존 패턴 확인**: 같은 레이어의 인접 슬라이스 하나를 읽고 구조와 네이밍을 맞춥니다(Grep/Read).
3. **구현**: 명시적 `Props` 인터페이스, `ref`는 일반 prop(`forwardRef` 금지), 스타일은 Tailwind v4 + `cn` + CVA. 디자인에 없는 스타일은 추가하지 않습니다.
4. **분리**: 상태·데이터 로직이 있으면 `model/`·`api/`·`lib/`로 나눕니다. 데이터는 Zod 검증과 트랜스포머를 거친 뒤 UI에 전달합니다.
5. **Public API**: 슬라이스의 `index.ts`에서 외부에 공개할 것만 re-export합니다. 다른 슬라이스는 내부 세그먼트를 직접 임포트할 수 없습니다.
6. **테스트**: 로직이 있으면 `.claude/rules/testing.md` 기준으로 함께 작성합니다.
7. **검증**: `pnpm typecheck`, `pnpm lint`, `pnpm test` 결과를 보고합니다.
