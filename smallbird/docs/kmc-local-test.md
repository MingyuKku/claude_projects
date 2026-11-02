# 로컬 KMC 본인인증·구독 결제 테스트 (hosts 우회)

로컬(`localhost`)에서 KMC 휴대폰 본인인증과 구독 결제(KG이니시스 정기결제)를 끝까지 확인하는 방법입니다. 로컬 전용 절차이며 배포 환경과 무관합니다.

## 왜 로컬에서 바로 안 되나

- KMC는 인증 요청을 보낸 페이지의 도메인을 검사합니다. 등록되지 않은 도메인에서 요청하면 KMC 팝업에 **"요청 정보가 유효하지 않습니다.(7-3)"**이 뜹니다. 같은 요청값을 `https://stage.client.bigbird.co.kr`에서 보내면 정상입니다(2026-10-26 비교 확인).
- 인증 뒤 돌아오는 주소(`trUrl`)는 `GET /v3/mypage/cert/init`에 프론트가 현재 출처의 `/cert/success`를 보내 정해집니다(2026-10-28 공개, `localhost`도 Stage에서 허용). KMC 등록이 `localhost`에는 없어 7-3은 그대로라, 아래 우회로는 계속 필요합니다.
- v3 도메인의 KMC 등록은 백엔드 요청 중입니다(`docs/mypage-api.md` §4-13). 그 전까지는 아래처럼 **Stage 도메인을 내 컴퓨터로 돌려** 로컬 v3를 그 주소로 띄웁니다.

구독 결제도 같은 이유로 이 방법이 필요합니다. 결제 서버(`stage.client.bigbird.co.kr:3101`)가 만든 이니시스 결과 수신 주소(`returnUrl`)와 요청 페이지의 도메인이 같아야 하고, 결제 서버의 CORS 허용 목록에도 `https://stage.client.bigbird.co.kr`만 있어 `localhost`·내부 IP(`http://192.168.x.x:5173`)에서 직접 호출하면 CORS 오류가 납니다(2026-10-28 `OPTIONS`로 확인).

```
브라우저 https://stage.client.bigbird.co.kr       ──(/etc/hosts → 127.0.0.1)──▶  Caddy :443  (HTTPS)  ──▶  pnpm dev :5173
브라우저 https://stage.client.bigbird.co.kr:3101  ──(/etc/hosts → 127.0.0.1)──▶  Caddy :3101 (HTTPS)  ──▶  Stage 결제 서버(실제 IP)
```

## 준비 (최초 1회)

```bash
brew install caddy
mkdir -p ~/.config/caddy
cat > ~/.config/caddy/kmc-local.Caddyfile <<'EOF'
# 로컬 KMC 테스트용: stage.client.bigbird.co.kr(HTTPS) → pnpm dev(5173)
stage.client.bigbird.co.kr {
	tls internal
	reverse_proxy localhost:5173 {
		header_up Host {upstream_hostport}
		# Stage 백엔드가 X-Forwarded-For가 있으면 500을 냄
		header_up -X-Forwarded-For
	}
}

# 구독 결제용: hosts가 이 도메인을 127.0.0.1로 돌리므로 :3101도 로컬로 오는데, 받는 쪽이 없어 ERR_CONNECTION_REFUSED가 남.
# 그래서 실제 Stage 결제 서버 IP로 직접 연결해 넘김. IP는 Caddy를 띄울 때 STAGE_PAY_IP 환경변수로 넣음(IP가 바뀌면 Caddy를 다시 띄움).
stage.client.bigbird.co.kr:3101 {
	tls internal
	reverse_proxy https://{$STAGE_PAY_IP}:3101 {
		header_up Host stage.client.bigbird.co.kr
		header_up -X-Forwarded-For
		transport http {
			tls_server_name stage.client.bigbird.co.kr
		}
	}
}
EOF
```

- `tls internal`: 공개 도메인이라 기본값이면 Let's Encrypt에서 실제 인증서를 받으려 하고 실패합니다. Caddy 로컬 인증서를 쓰게 합니다.
- 두 번째 블록(`:3101`)은 구독 결제를 확인할 때만 필요합니다. KMC만 확인한다면 없어도 됩니다. 결제 서버 IP는 고정이 아니어서(2026-10-28 `3.37.34.183`·`3.38.254.149` → 2026-11-02 `13.124.36.145`·`54.116.184.146`) 파일에 적지 않고, Caddy를 띄울 때 `STAGE_PAY_IP` 환경변수로 넣습니다(아래 "켜기" 3). Caddyfile의 `{$STAGE_PAY_IP}`는 설정을 읽을 때 한 번만 바뀌므로, 띄운 뒤 IP가 바뀌면 Caddy를 다시 띄웁니다. IP가 바뀌는 원인(로드밸런서 등)은 확인하지 못했습니다. 이미 첫 블록만 있는 파일을 쓰고 있다면 두 번째 블록을 붙이고 Caddy를 다시 띄웁니다. `caddy reload`를 쓸 때도 같은 셸에서 `STAGE_PAY_IP`를 먼저 export해야 합니다(설정을 reload를 실행한 셸에서 읽음).
- `header_up -X-Forwarded-For`: Caddy는 기본으로 이 헤더를 붙이는데, Stage 백엔드는 이 헤더가 있으면 값과 상관없이 `GET /sec` 등에서 500을 냅니다(2026-10-26 확인). 그래서 한 줄 명령(`caddy reverse-proxy`)은 쓰지 않습니다. 헤더를 뺄 수 없습니다.

## 켜기

1. `pnpm dev`를 띄웁니다(5173). 백엔드는 Stage를 바라봐야 합니다.
2. hosts에 Stage 도메인을 추가합니다.

   ```bash
   sudo sh -c 'echo "127.0.0.1 stage.client.bigbird.co.kr" >> /etc/hosts'
   ```

3. Caddy를 띄웁니다(터미널을 열어 둔 채로). macOS는 sudo 없이도 443을 열 수 있습니다.

   ```bash
   export STAGE_PAY_IP=$(dig +short A stage.client.bigbird.co.kr @8.8.8.8 | grep -E '^[0-9]+(\.[0-9]+){3}$' | head -1)
   : "${STAGE_PAY_IP:?dig 실패: 결제 서버 IP를 못 찾음}"
   caddy run --config ~/.config/caddy/kmc-local.Caddyfile
   ```

   - `dig @8.8.8.8`은 hosts를 거치지 않아 hosts를 바꾼 뒤에도 실제 IP를 가져옵니다. `grep`은 IP 줄만 남깁니다. dig가 응답을 못 받으면 `;; connection timed out ...`을 표준 출력으로 내고, CNAME이면 첫 줄이 호스트명이라 그대로 쓰면 안 됩니다.
   - 두 번째 줄은 값이 비면 멈춥니다. 빈 값이면 upstream이 `:3101`(Caddy 자신)이 되어 에러 없이 떠서 결제 요청이 자기 자신으로 돕니다.

   처음 실행하면 Caddy의 로컬 인증서를 시스템에 신뢰 등록하느라 비밀번호를 물을 수 있습니다. 등록이 안 됐으면 Caddy가 떠 있는 상태에서 `sudo caddy trust`를 한 번 실행합니다. 등록 뒤 브라우저를 완전히 껐다 켭니다. Chrome을 끄기 어려우면 Safari나 별도 프로필 Chrome(`open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-kmc-test`)을 씁니다. Firefox는 macOS 키체인을 쓰지 않아 경고가 계속 뜹니다.

4. 브라우저에서 `https://stage.client.bigbird.co.kr`에 접속해 아이디·비밀번호로 로그인하고 인증을 진행합니다.
   - 마이페이지: 계정 설정 → 정보 수정 → 휴대폰 "인증"
   - 회원가입: `/join?service=client` → 본인인증 (member 서버의 `trUrl`은 아직 확인 전)
   - 구독 결제: 마이페이지 > 구독 → "구독하기" → 안내사항 동의 → "결제"(아래 "구독 결제 확인")

## 구독 결제 확인

- 흐름: "결제" → `GET /v3/mypage/subscription/init` 토큰 → 결제 서버 `POST …:3101/v3/subscription/billing/subscribe/new-card` → 응답 값을 숨은 form에 담아 `issuanceUrl`(`inilitepay.inicis.com/pay/card/billing`)로 POST(전체 이동) → 이니시스 카드 입력 → 결제 서버 callback → `https://stage.client.bigbird.co.kr/mypage/subscribe?result=success|fail`로 복귀.
- 요청 `origin`은 `window.location.origin`이고, 서버는 2026-10-29부터 이 값을 검증하지 않습니다(허용 목록 제거, `ORIGIN_NOT_ALLOWED` 없음). 다만 결제 후 이 origin으로 돌아오고 결제 서버 CORS는 Stage 도메인만 허용하므로, 로컬 테스트는 Stage 도메인으로 열어야 합니다.
- 이 화면은 개발 서버(`pnpm dev`)에서만 열립니다(Stage·운영 빌드는 아직 "준비 중").
- 테스트 상점(`INIBillTst`)입니다. 2026-10-28에 이 절차로 결제가 되어 서버에 구독 1건(모집형 월 99,000원)·기본 카드 1장·결제 1건(`paid`)이 반영된 것을 `GET /v3/mypage/subscription/{subscriptions,billing-cards,payments}`로 확인했습니다. 실제 청구 여부는 확인하지 못했으니 테스트 카드 정보를 백엔드에 문의하고(Q-9) 실제 카드는 쓰지 마세요.
- 테스트 뒤 구독이 남으면 같은 상품을 다시 구독할 수 없습니다(`ALREADY_SUBSCRIBED`). 결제내역 탭의 "구독해지"로 정리하거나 다른 상품(PICK형)으로 확인합니다.
- 같은 토큰으로 `issuance`를 부르면 주문번호가 서버에 남을 수 있으니 반복 호출은 피합니다.
- 연결이 안 될 때: `ERR_CONNECTION_REFUSED` → Caddy에 `:3101` 블록이 없거나 Caddy가 꺼져 있음. CORS 오류 → `https://stage.client.bigbird.co.kr`가 아닌 주소(localhost·내부 IP)로 접속함. `502` → Caddy를 띄운 뒤 결제 서버 IP가 바뀌었을 수 있음. dig 값을 다시 확인하고 Caddy를 다시 띄움(위 "켜기" 3).

## 끄기 (반드시)

켜 둔 동안 이 컴퓨터에서 `stage.client.bigbird.co.kr`은 **v2 Stage가 아니라 내 로컬 v3**입니다. 테스트가 끝나면 되돌립니다.

```bash
# 1. Caddy 터미널에서 Ctrl+C (백그라운드면 caddy stop)
# 2. hosts에서 추가한 줄 삭제
sudo sed -i '' '/stage\.client\.bigbird\.co\.kr/d' /etc/hosts
# 3. DNS 캐시 비우기
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

## 정리됐는지 확인
```bash
grep -c "stage.client.bigbird.co.kr" /etc/hosts       # 0이면 정상
lsof -nP -iTCP:443 -iTCP:3101 -sTCP:LISTEN            # 비어 있으면 Caddy 종료됨
ping -c1 stage.client.bigbird.co.kr                   # 127.0.0.1이 아닌 실제 IP가 나오면 정상
```

## 확인 방법

- 연결: `curl -sk https://stage.client.bigbird.co.kr/` 가 로컬 `index.html`을 돌려주면 됩니다.
- 결제 서버 연결: `curl -sk -X OPTIONS -H "Origin: https://stage.client.bigbird.co.kr" -H "Access-Control-Request-Method: POST" -i https://stage.client.bigbird.co.kr:3101/v3/subscription/billing/subscribe/new-card`가 `HTTP/2 200`과 `access-control-allow-origin`을 돌려주면 됩니다.
- 인증: KMC 팝업이 7-3 에러 없이 통신사 선택 화면을 띄우고, 인증을 마치면 팝업이 닫히며 휴대폰 칸이 새 번호로 바뀝니다.

## 한계

- 구독 결제는 결제창을 열고 복귀하는 흐름까지만 확인할 수 있고, 서버가 이니시스 결과를 처리해 구독을 만드는 부분은 서버 쪽 동작이라 프론트에서 보이지 않습니다.
- PC 팝업 흐름용입니다. 휴대폰 실기기는 hosts를 바꾸기 어려워 v3 Stage 배포 뒤 확인합니다.
- 소셜 로그인은 제공자 콘솔에 등록된 콜백 주소가 달라 이 방법으로 확인하지 않습니다.
