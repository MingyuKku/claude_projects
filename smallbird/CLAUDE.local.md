# 로컬 작업 메모 (gitignored)

## iOS 실기기 최소 재현 테스트

- iPhone 실기기에서만 나는 문제(hover 고정, 상단 바 틴트, 가상 키보드, 터치 → mouse 호환 이벤트 등)는 추측하거나 에뮬레이션으로 판단하지 않고 `.claude/device-test/README.md` 절차로 확인한다.
- 위치: `.claude/device-test/` (`proxy.py`, `pages/_template.html`, `examples/app-toast.html`). 로컬 전용이라 커밋하지 않는다.
- 전제: USB·Web Inspector·폰 앱 설치 없이, 같은 Wi-Fi의 폰 Safari로 접속한다. 콘솔·네트워크가 필요하면 주소에 `?eruda=1`.
- 5173 dev 서버는 재사용하고 끄지 않는다. 내가 띄운 프록시는 PID 파일로만 종료한다.
