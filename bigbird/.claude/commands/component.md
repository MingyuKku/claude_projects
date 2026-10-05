---
description: "Scaffold a feature-sliced React component following bigbird conventions"
---

`bigbird` 컨벤션에 맞춰 새로운 컴포넌트를 스캐폴딩합니다.

구현 시 다음 구조를 준수하세요:
- 컴포넌트 파일: `src/features/{domain}/components/{ComponentName}.tsx`
- 명시적 `Props` 인터페이스 정의
- 필요한 경우 `transformers/` 및 `hooks/` 분리
- Tailwind CSS v4 스타일링 및 Glassmorphism/Dark 테마 조화
- 단일 책임 원칙 준수
