# 실기기 최소 재현 테스트

> 로컬 전용 폴더다. `.git/info/exclude`에 `.claude/device-test/`가 있어 커밋·push 대상이 아니다(`.gitignore`는 건드리지 않음).

on-device minimal repro + on-screen logging + 변형 비교. 실제 앱 컴포넌트 하나만 띄운 작은 페이지를 iPhone에서 열고, 관찰한 값을 화면에 로그로 찍고, 수정안(변형)을 링크 하나로 바꿔 가며 같은 조작으로 비교한다.

## 언제 쓰나

- iOS Safari 고유 동작(터치 → mouse 호환 이벤트, hover 고정, 상단 바 틴트, 가상 키보드 등)이 의심될 때
- 데스크톱 Chromium 모바일 에뮬레이션으로 재현되지 않는 문제
- USB 연결·Xcode·Web Inspector 없이 같은 Wi-Fi의 폰만으로 확인하고 싶을 때

`.claude/skills/mobile-keyboard/SKILL.md`의 원칙과 같다: **추측으로 고치지 않고, 공식 문서·버그 트래커 근거를 찾고, 실기기에서 측정한다.** 에뮬레이션 결과는 근거로 쓰지 않는다. 보고할 때는 실기기에서 확인한 것과 못 한 것을 나눠 적는다.

## 파일

| 파일 | 용도 |
| --- | --- |
| `proxy.py` | 페이지를 주고 나머지를 Vite dev 서버로 중계하는 프록시. 변형별 응답 패치 표(`PATCHES`) 포함 |
| `pages/_template.html` | 새 페이지 골격(앱 컴포넌트 마운트 + 화면 로그 + 변형 링크 + `?eruda=1` 옵션). 복사해서 `[바꿀 곳]`만 고친다 |
| `examples/app-toast.html` | 2026-11-20 sonner 조사의 완성 사례. 앱 `Toaster`를 띄우고 base·A1·A2 비교. 출발점이 아니라 `[바꿀 곳]`을 어떻게 채웠는지 보는 참고용 |

## 구조

```
iPhone Safari
   │  http://<Mac IP>:8099/?v=a2
   ▼
proxy.py (0.0.0.0:8099)
   ├─ /, /index.html  → pages/<페이지>.html  (+ Set-Cookie: variant=<v>)
   ├─ /@vite/client   → 스텁 (HMR 끔, updateStyle 제공)
   └─ 그 밖           → http://localhost:5173 (사용자가 띄운 Vite dev 서버)
                         └─ variant 쿠키에 맞는 PATCHES 가 있으면 응답 문자열 치환
```

### 왜 `vite --host`가 아니라 프록시인가

- `vite.config.ts`의 주석대로 세션 쿠키가 `Secure; SameSite=None`이라 http인 LAN IP 주소에서는 저장되지 않는다(설정이 개발 서버에서만 떼 주지만, 앱 전체 동작을 폰에서 맞추는 건 목적이 아니다).
- 재현에는 앱 전체(라우터·인증·API)가 필요 없다. 컴포넌트 하나만 마운트하면 원인과 무관한 변수가 줄어든다.
- 레포 파일(설정·소스)을 하나도 바꾸지 않는다. 이미 떠 있는 5173 dev 서버를 그대로 재사용하고, 라이브러리 패치도 응답에서만 바꾼다.
- HMR WebSocket이 LAN에서 실패하면 Vite 클라이언트가 페이지를 새로고침해 측정이 끊긴다. 프록시가 `/@vite/client`를 스텁으로 바꿔 막는다.

## 실행 절차

1. **dev 서버 확인** — 이미 떠 있으면 재사용한다. 절대 끄지 않는다(`pkill -f vite` 금지).
   ```bash
   lsof -iTCP:5173 -sTCP:LISTEN     # 없을 때만 레포 루트에서 pnpm dev
   ```
2. **Mac IP 확인** (폰과 같은 Wi-Fi)
   ```bash
   ipconfig getifaddr en0
   ```
3. **프록시 실행** — 포트가 이미 쓰이고 있으면(다른 세션의 프록시) 다른 포트를 쓴다.
   ```bash
   cd .claude/device-test
   lsof -iTCP:8099 -sTCP:LISTEN     # 비어 있는지
   python3 proxy.py --port 8099 --page pages/<주제>.html > /tmp/device-proxy.log 2>&1 &
   cat proxy-8099.pid               # 시작할 때 PID 파일을 쓴다. 출력에 LAN 접속 주소도 나온다
   ```
   인자: `--port`(기본 8099), `--target`(기본 `http://localhost:5173`), `--page`(기본 `pages/_template.html`).
4. **폰 접속** — Safari에서 `http://<Mac IP>:8099/?v=base`. 처음엔 macOS 방화벽이 Python 수신 허용을 물을 수 있다.
   - 화면에 `변형: … / 패치 적용: 예|아니오`가 맞게 나오는지 먼저 본다.
   - 소스를 바꾼 뒤에는 HMR이 없으니 폰에서 새로고침한다.
5. **결과 받기** — 사용자에게 변형마다 같은 조작을 하고 화면(로그 포함) 스크린샷을 보내 달라고 한다. 조작과 기대 결과를 미리 표로 주고, 받은 결과를 같은 표에 o/x로 채운다.

   | 변형 | 조작 1 결과 | 조작 2 결과 | … |
   | --- | --- | --- | --- |
   | base |  |  |  |
   | A1 |  |  |  |
6. **정리** — 내가 띄운 프록시 PID만 종료한다. 다른 세션의 프록시나 5173 dev 서버는 건드리지 않는다.
   ```bash
   kill "$(cat proxy-8099.pid)"     # SIGTERM 이면 PID 파일도 지운다
   ```

## 이 방법의 이름

업계에서 하나로 굳은 이름은 없고 조각마다 부르는 말이 있다.

- **on-device testing / real device testing**: 에뮬레이터가 아닌 실기기 확인
- **minimal reproduction (minimal repro)**: 컴포넌트 하나만 띄운 최소 재현
- **on-device(in-page) debugging, remote console**: 화면 안 콘솔로 보기. eruda·vConsole이 대표
- **A/B 변형 비교(variant testing)**: 수정안을 링크로 바꿔 같은 조작으로 비교

## 에이전트에게 시킬 때 프롬프트 예

> iPhone 실기기에서만 나는 문제야. USB·Inspector·앱 설치 없이 `.claude/device-test/README.md` 방식(최소 재현 페이지 + 화면 로그 + 변형 링크)으로 확인하자. 대상은 `<컴포넌트/증상>`이고, 수정안은 `<A1/A2>` 변형으로 비교해 줘. 프록시 띄우고 접속 주소와 조작표를 줘.

- 담기 좋은 것: 증상, 대상 컴포넌트, 비교할 수정안, "실기기 결과만 근거(에뮬레이션은 근거 아님)"
- README를 가리키면 에이전트가 절차·작성 규칙·정리 방법을 그대로 따른다. 이 폴더는 gitignore라 다른 워크트리에는 없으니 그곳에서는 경로를 알려 줘야 한다.
- 콘솔·네트워크까지 필요하면 "eruda도 켜자"(`?eruda=1`)를 덧붙인다.

## 페이지 작성 규칙

`pages/_template.html`에서 시작한다. 이번 조사에서 실제로 걸렸던 것들이다.

- **측정 대상에 이벤트 리스너를 직접 달지 않는다.** iOS는 click(등) 리스너가 있는 요소를 '클릭 가능'으로 보고 탭할 때 mouse 호환 이벤트를 보낸다. 리스너를 다는 순간 측정 대상의 동작이 바뀐다(sonner 조사 1차 시도에서 토스트 흉내 요소에 리스너를 달았다가 이 교란이 있었고, 그 페이지는 지웠다). 대상 요소는 `MutationObserver`로 속성(`data-*` 등)만 관찰하고, 필요한 이벤트는 `document`에 capture로 단다.
- **React Refresh 프리앰블 스텁**: `@vitejs/plugin-react`가 변환한 `.tsx`는 `__vite_plugin_react_preamble_installed__`·`$RefreshReg$`·`$RefreshSig$`가 없으면 오류를 낸다. 템플릿 첫 스크립트에 들어 있다.
- **CJS deps는 default import**: `react-dom_client`, `react_jsx-dev-runtime`처럼 CJS인 패키지는 Vite가 default export로 감싼다(`const {default: RD} = await import(...)`). sonner 같은 ESM은 이름으로 받는다.
- **deps 해시는 동적으로 찾는다**: `/node_modules/.vite/deps/<이름>.js?v=<해시>`의 해시는 Vite가 다시 최적화하면 바뀌고 옛 해시는 504가 난다. 그 deps를 import하는 앱 소스(`/src/app/main.tsx`, `/src/shared/ui/sonner.tsx` 등)의 변환 결과를 fetch해 정규식으로 찾는다. 같은 인스턴스를 써야 하므로(React 중복 방지) 직접 경로를 만들지 않는다.
- **애니메이션 중에 측정하지 않는다**: 토스트가 들어오는 중에 탭하면 hover 판정이 어긋났다. 등장·퇴장 애니메이션이 끝난 뒤 조작하도록 안내한다.
- **사람이 조작할 시간을 충분히**: 4초 토스트는 읽고 탭하기에 짧았다. 측정용으로 길게(예: 15초) 늘린다.
- **변형은 쿼리 + 쿠키**: `?v=<이름>`으로 열면 프록시가 쿠키에 저장하고, 이후 모듈 요청(쿼리가 없음)에서도 변형을 알 수 있다. 페이지 안 분기(A1처럼 보정 코드)는 `window.__VARIANT__`로, 라이브러리 수정(A2처럼)은 `proxy.py`의 `PATCHES` 표로 한다.
- **패치 적용 여부를 화면에 표시**: 찾을 문자열이 라이브러리 버전에 따라 달라질 수 있다. `PATCHES`의 `marker`가 켜는 전역값을 화면에 띄워 "패치 적용: 예"를 확인한 결과만 쓴다. 일부만 적용되면 프록시가 stderr에 경고한다.
- 화면 로그는 최신이 위로 오게 하고, 시각(초)을 붙인다. `window.onerror`도 로그로 보낸다.

## 사전 점검 (Playwright)

폰에 넘기기 전에 Playwright(Chromium)로 `http://localhost:<port>/?v=base`를 열어 페이지가 로드되고 콘솔 에러가 없는지, 대상 컴포넌트가 뜨는지만 본다. **iOS 동작 판단 근거로 쓰지 않는다.** 확인이 끝나면 브라우저를 닫는다(`browser_close`).

## 사례: 2026-11-20 sonner 토스트 iOS 조사

증상: iPhone에서 토스트를 탭하면 자동으로 닫히지 않고, 상단 바(Safari 툴바 영역)가 토스트 색으로 물든다.

**원인 1 — 자동 닫힘 멈춤**
- iOS는 탭할 때 `mouseover`/`mouseenter`만 보내고, 다른 '클릭 가능' 요소를 탭하기 전까지는 `mouseout`/`mouseleave`를 보내지 않는다. 근거: Apple *Safari Web Content Guide* "One-Finger Events", WebKit bug 158517.
- sonner는 `onMouseEnter`/`onMouseMove`에서 `expanded=true`, `onMouseLeave`에서 해제하고, `expanded`인 동안 타이머를 멈춘다 → 탭 한 번으로 `expanded`가 고정돼 타이머가 정지한다.

**원인 2 — 상단 바 틴트**
- iOS 26 Safari는 화면 위 4px 지점의 가운데 점을 hit-test해, 너비 90% 이상인 fixed/sticky 조상과 그 경로의 배경색으로 상단 바를 칠한다. 근거: WebKit `LocalFrameView::fixedContainerEdges` (main `610f3f16`).
- `expanded`가 되면 sonner 토스트의 `::after`(높이 gap+1px, `bottom: 100%`)가 그 점에 걸린다.
- 참고: MDN BCD 기준 Safari 26부터 `theme-color`는 설치된 웹앱에서만 적용돼 일반 탭에서는 이걸로 덮을 수 없다.

**변형**
- base: 앱 그대로
- A1: 터치 뒤 `expanded`가 켜지면 페이지가 sonner 컨테이너에 합성 `mouseout`을 보내 해제
- A2: 프록시가 sonner deps를 패치해 `onPointerEnter`/`onPointerMove`에서 `pointerType === "mouse"`일 때만 `expanded`

**실기기 결과** (iPhone, iOS 26 Safari)

| 변형 | 탭 후 자동 닫힘 | 탭 후 틴트 | 퇴장 시 틴트 |
| --- | --- | --- | --- |
| 기존 | x | o | o |
| A1 | o | x | o |
| A2 | o | x | o |

(틴트 o = 상단 바가 물듦. 퇴장 애니메이션 중 틴트는 세 변형 모두 남는다.)

**상태**: 수정은 아직 결정 전이다. A2를 `pnpm patch`로 적용하는 안을 추천했고 팀 결정을 기다리는 중이다.
