import {
  INICIS_FORM_ID,
  INICIS_MOBILE_FORM_ID,
  PAYMENT_GOODS_NAME,
} from "../model/constants";

import type { DeviceType } from "../model/constants";
import type {
  ChargeInit,
  MobilePayResponse,
  PayResponse,
} from "../model/schema";

declare global {
  interface Window {
    INIStdPay?: { pay: (formId: string) => void };
  }
}

const toText = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

/**
 * 이니시스 표준결제 폼의 입력값. v2 충전(`BizMoneyModal`)과 같은 필드 구성:
 * 결제 서버 응답은 그대로 넣고(`cardQuotaBase`만 이니시스 이름 `quotabase`로), 금액은 응답이 아니라 사용자가 입력한 값을 씀.
 * `returnUrl`은 응답 값, `closeUrl`은 호출하는 쪽이 정한 값을 씀(이니시스가 도메인이 요청 페이지와 같아야 한다고 검사함).
 */
export function buildInicisFields(
  amount: number,
  init: ChargeInit,
  pay: PayResponse,
  urls: { closeUrl: string },
): Record<string, string> {
  return {
    currency: "WON",
    price: String(amount),
    buyername: toText(init.name),
    goodsname: PAYMENT_GOODS_NAME,
    buyertel: toText(init.phone_number),
    buyeremail: toText(init.email),
    timestamp: toText(pay.timestamp),
    signature: toText(pay.signature),
    mKey: toText(pay.mKey),
    version: toText(pay.version),
    mid: toText(pay.mid),
    oid: toText(pay.oid),
    returnUrl: toText(pay.returnUrl),
    closeUrl: urls.closeUrl,
    quotabase: toText(pay.cardQuotaBase),
    gopaymethod: toText(pay.gopaymethod),
    acceptmethod: toText(pay.acceptmethod),
    merchantData: toText(pay.merchantData),
  };
}

// 이니시스 `INIStdPay_third-party.js`의 `$jINI.mobileBrowser`(detectmobilebrowser.com) 첫 번째 정규식을 그대로 옮김(2026-11-04 대조).
// 스크립트는 이어서 UA 앞 4글자 목록(옛 피처폰용)도 검사하지만 요즘 브라우저 UA는 모두 `Mozi`/`Oper` 등으로 시작해 해당이 없어 뺌.
// 이 기준이 스크립트와 다르면 PC 흐름으로 갔다가 이니시스가 "PC로 결제 진행" 알림만 띄움.
const MOBILE_USER_AGENT =
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;

/** 접속 기기에 맞는 결제 방식. 휴대폰은 PC용 `INIStdPay.pay()`를 쓸 수 없어 모바일 폼 전송으로 나눔. */
export function getChargeDeviceType(
  userAgent: string = navigator.userAgent,
): DeviceType {
  return MOBILE_USER_AGENT.test(userAgent) ? "MOBILE" : "PC";
}

const scriptLoads = new Map<string, Promise<void>>();
/** 스크립트 요청이 응답 없이 멈춰도 충전 버튼이 영원히 잠기지 않게 기다리는 시간(ms). */
const SCRIPT_LOAD_TIMEOUT_MS = 10_000;

/** 이니시스 표준결제 스크립트를 한 번만 불러옴. 실패하면 다음 시도에서 다시 불러옴. */
export function loadInicisScript(url: string) {
  const cached = scriptLoads.get(url);
  if (cached) return cached;

  const load = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.charset = "UTF-8";
    const fail = (message: string) => {
      clearTimeout(timer);
      scriptLoads.delete(url);
      script.remove();
      reject(new Error(message));
    };
    const timer = setTimeout(
      () => fail("INIStdPay script load timed out"),
      SCRIPT_LOAD_TIMEOUT_MS,
    );
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => fail("INIStdPay script load failed");
    document.head.appendChild(script);
  });
  scriptLoads.set(url, load);
  return load;
}

/**
 * 숨은 폼을 만들어 결제창을 엶. 결제창이 폼을 읽는 동안 DOM에 있어야 해서 바로 지우지 않고,
 * 다음 결제 때 같은 id의 폼을 교체함.
 */
export function openInicisPayment(fields: Record<string, string>) {
  if (!window.INIStdPay) throw new Error("INIStdPay is not loaded");

  document.getElementById(INICIS_FORM_ID)?.remove();
  const form = document.createElement("form");
  form.id = INICIS_FORM_ID;
  form.method = "POST";
  form.hidden = true;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);

  window.INIStdPay.pay(INICIS_FORM_ID);
}

/**
 * 모바일 결제: 서버가 준 값을 숨은 폼에 넣어 `paymentUrl`로 같은 창에서 POST함(이니시스 페이지로 넘어갔다가 `redirectUri`로 돌아옴).
 * 한글 값이 깨지지 않게 이니시스 규격(EUC-KR)으로 인코딩해 보냄.
 */
export function submitInicisMobilePayment({
  paymentUrl,
  form: values,
}: MobilePayResponse) {
  document.getElementById(INICIS_MOBILE_FORM_ID)?.remove();
  const form = document.createElement("form");
  form.id = INICIS_MOBILE_FORM_ID;
  form.method = "POST";
  form.action = paymentUrl;
  form.acceptCharset = "EUC-KR";
  form.hidden = true;
  for (const [name, value] of Object.entries(values)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = toText(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
