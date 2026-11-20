#!/usr/bin/env python3
"""실기기 최소 재현 테스트용 프록시.

폰 → http://<Mac IP>:<port>/ → 이 프록시 → Vite dev 서버(기본 localhost:5173)

- `/`(와 `/index.html`)는 --page 로 지정한 테스트 페이지를 그대로 준다.
- `/@vite/client` 는 스텁으로 바꾼다. HMR WebSocket 연결이 실패하면 Vite 클라이언트가
  페이지를 새로고침해 측정이 끊기기 때문. CSS 모듈이 부르는 updateStyle 은 스텁에서 제공한다.
- 나머지 요청은 --target 으로 중계한다.
- `?v=<변형>` 으로 페이지를 열면 변형을 쿠키(variant)에 저장하고, 이후 모듈 요청에서
  PATCHES 표에 맞는 응답 문자열을 바꾼다. 패치가 모두 적용되면 응답 맨 앞에 표시 코드를 붙인다.

Python 3.9 표준 라이브러리만 쓴다.
"""
import argparse
import http.server
import os
import signal
import socket
import socketserver
import subprocess
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# 변형별 응답 패치 표
#   suffix : 요청 경로(쿼리 제외)가 이 문자열로 끝나면 대상
#   variant: 쿠키 variant 값이 이것일 때만 적용
#   pairs  : (찾을 바이트, 바꿀 바이트) 목록. 모두 한 번 이상 찾아야 "적용"으로 본다
#   marker : 모두 적용됐을 때 응답 맨 앞에 붙일 JS (페이지가 화면에 적용 여부를 표시할 때 씀)
# 새 변형을 추가할 때는 여기만 고친다. 라이브러리 버전이 바뀌면 찾을 문자열이 달라질 수 있으니
# 페이지에서 marker 가 켜졌는지 반드시 확인한다.
# ---------------------------------------------------------------------------
PATCHES = [
    {
        # A2: sonner 토스트의 hover 확장을 마우스 포인터일 때만 켠다 (2026-11-20 iOS 조사)
        "suffix": "/deps/sonner.js",
        "variant": "a2",
        "pairs": [
            (
                b"onMouseEnter: () => setExpanded(true),",
                b'onPointerEnter: (e) => { if (e.pointerType === "mouse") setExpanded(true); },',
            ),
            (
                b"onMouseMove: () => setExpanded(true),",
                b'onPointerMove: (e) => { if (e.pointerType === "mouse") setExpanded(true); },',
            ),
        ],
        "marker": b"globalThis.__sonnerPatched = true;\n",
    },
]

# Vite 클라이언트 스텁. HMR 은 동작하지 않으므로 코드를 바꾸면 폰에서 직접 새로고침한다.
VITE_CLIENT_STUB = b"""export function createHotContext(){return{accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},send(){},data:{}}}
export function updateStyle(id,css){let s=document.querySelector('style[data-vite-dev-id="'+id+'"]');if(!s){s=document.createElement('style');s.setAttribute('data-vite-dev-id',id);document.head.appendChild(s)}s.textContent=css}
export function removeStyle(){}
export function injectQuery(u){return u}
"""


def parse_args():
    ap = argparse.ArgumentParser(description="실기기 최소 재현 테스트 프록시")
    ap.add_argument("--port", type=int, default=8099, help="열 포트 (기본 8099)")
    ap.add_argument("--target", default="http://localhost:5173", help="중계할 Vite dev 서버 (기본 http://localhost:5173)")
    ap.add_argument("--page", default="pages/_template.html", help="/ 에서 줄 페이지 (이 폴더 기준 상대 경로 또는 절대 경로)")
    return ap.parse_args()


def read_cookie(header, name):
    for part in (header or "").split(";"):
        k, _, v = part.strip().partition("=")
        if k == name:
            return v
    return ""


def apply_patches(path, variant, body):
    for p in PATCHES:
        if not path.endswith(p["suffix"]) or variant != p["variant"]:
            continue
        hits = 0
        for old, new in p["pairs"]:
            if old in body:
                body = body.replace(old, new)
                hits += 1
        if hits == len(p["pairs"]):
            body = p["marker"] + body
        else:
            print(f"[경고] 패치 일부만 적용됨: {p['suffix']} ({hits}/{len(p['pairs'])}) — 라이브러리 코드가 바뀌었는지 확인", file=sys.stderr)
    return body


def make_handler(page_path, target):
    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            path, _, query = self.path.partition("?")
            if path in ("/", "/index.html"):
                params = dict(kv.partition("=")[::2] for kv in query.split("&") if kv)
                variant = params.get("v") or "base"
                with open(page_path, "rb") as f:
                    return self.reply(f.read(), "text/html; charset=utf-8", cookie=f"variant={variant}; Path=/")
            if path == "/@vite/client":
                return self.reply(VITE_CLIENT_STUB, "text/javascript")
            try:
                req = urllib.request.Request(target + self.path, headers={"Accept": self.headers.get("Accept", "*/*")})
                with urllib.request.urlopen(req) as r:
                    body = r.read()
                    variant = read_cookie(self.headers.get("Cookie"), "variant")
                    body = apply_patches(path, variant, body)
                    self.reply(body, r.headers.get("Content-Type", "application/octet-stream"), r.status)
            except urllib.error.HTTPError as e:
                self.reply(e.read(), "text/plain; charset=utf-8", e.code)
            except urllib.error.URLError as e:
                self.reply(f"dev 서버에 연결 못 함: {target} ({e.reason})".encode(), "text/plain; charset=utf-8", 502)

        def reply(self, body, content_type, code=200, cookie=None):
            try:
                self.send_response(code)
                if cookie:
                    self.send_header("Set-Cookie", cookie)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass  # 폰이 요청을 끊은 경우 (페이지 이동 등)

        def log_message(self, *args):
            pass

    return Handler


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def lan_ips():
    ips = []
    for iface in ("en0", "en1"):
        try:
            ip = subprocess.run(["ipconfig", "getifaddr", iface], capture_output=True, text=True, timeout=2).stdout.strip()
            if ip:
                ips.append(ip)
        except (OSError, subprocess.SubprocessError):
            pass
    if not ips:
        try:
            ips.append(socket.gethostbyname(socket.gethostname()))
        except OSError:
            pass
    return ips


def main():
    args = parse_args()
    page_path = args.page if os.path.isabs(args.page) else os.path.join(HERE, args.page)
    if not os.path.isfile(page_path):
        sys.exit(f"페이지 파일이 없음: {page_path}")
    pid_file = os.path.join(HERE, f"proxy-{args.port}.pid")
    server = Server(("0.0.0.0", args.port), make_handler(page_path, args.target.rstrip("/")))
    with open(pid_file, "w") as f:
        f.write(str(os.getpid()))
    print(f"페이지: {page_path}")
    print(f"중계 대상: {args.target}")
    print(f"PID {os.getpid()} → {pid_file}")
    print("접속 주소:")
    print(f"  http://localhost:{args.port}/")
    for ip in lan_ips():
        print(f"  http://{ip}:{args.port}/   ← 폰에서 (같은 Wi-Fi)")
    sys.stdout.flush()
    # kill <PID>(SIGTERM)로 끝내도 finally 에서 PID 파일을 지우도록
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        try:
            with open(pid_file) as f:
                if f.read().strip() == str(os.getpid()):
                    os.remove(pid_file)
        except OSError:
            pass


if __name__ == "__main__":
    main()
