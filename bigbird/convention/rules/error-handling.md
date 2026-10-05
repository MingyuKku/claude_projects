---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# 에러 핸들링 및 에러 바운더리 컨벤션

## 1. 비동기 작업: 중첩 try/catch 대신 Radash `tryit` 활용

```typescript
import { tryit } from 'radash';

// ✅ 좋은 예: 튜플 기반의 명확한 에러 처리
const [err, data] = await tryit(fetchData)();
if (err) {
  logger.error('데이터 페칭 실패', { error: err });
  showToast({ type: 'error', message: '데이터를 불러오지 못했습니다.' });
  return;
}
```

## 2. React 에러 바운더리 (Error Boundary)

- 전역 에러 바운더리는 `src/shell/providers/ErrorBoundary.tsx`에 배치합니다.
- 차트, 데이터 그리드, 지도 등 복잡한 위젯 영역에는 지역(Localized) 에러 바운더리를 적용하여 전체 화면 중단을 방지합니다.
- 에러 발생 시 사용자에게 친절한 안내와 재시도(Retry) 액션을 제공합니다.

## 3. Zod 기반 폼 유효성 검증

- 사용자 입력 검증에는 컴포넌트와 함께 배치된 Zod 스키마를 사용합니다.
- 스키마 검증 실패 시 사용자 친화적인 피드백 메시지를 필드 하단에 즉시 렌더링합니다.
