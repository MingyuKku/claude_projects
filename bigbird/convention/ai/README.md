# AI 인스트럭션 템플릿 (SSOT 시스템)

이 디렉터리는 모델 비종속적 및 모델 전용 AI 인스트럭션 파일들을 단일 진실 공급원(SSOT)으로부터 일괄 관리합니다.

## 도입 목적

- 공유 가이드라인에 대한 **단일 편집 워크플로우** 유지.
- `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.gemini/settings.json` 간의 설정 불일치(Drift) 원천 차단.
- 핵심 React 아키텍처 정책을 공유하면서 각 도구별 최적화 래퍼 제공.

## 디렉터리 구성

- `templates/*.tmpl`: `{{> partials/<name>.md }}` 플레이스홀더가 포함된 출력 템플릿
- `partials/*.md`: 템플릿에 삽입되는 원자적 마크다운 블록
- `render.py`: 작성 및 CI 검증(`--check`)을 지원하는 크로스플랫폼 파이썬 컴파일러

## 사용 방법

모든 AI 인스트럭션 파일 렌더링 및 동기화:

```bash
python convention/ai/render.py
```

CI 파이프라인 또는 커밋 전 동기화 상태 검증 (불일치 시 non-zero 종료):

```bash
python convention/ai/render.py --check
```
