import {
  buildInicisFields,
  getChargeDeviceType,
  loadInicisScript,
  openInicisPayment,
  submitInicisMobilePayment,
} from "./inicis";

import type { ChargeInit, PayResponse } from "../model/schema";

const init: ChargeInit = {
  email: "adv@example.com",
  name: "홍길동",
  phone_number: "01012345678",
  encryptUserIdx: "enc",
};
const pay: PayResponse = {
  mid: "INIpayTest",
  version: "1.0",
  returnUrl: "https://pay.example.com/client/result",
  closeUrl: "https://pay.example.com/close",
  signature: "sig",
  timestamp: 1730000000000,
  mKey: "mkey",
  oid: "oid-1",
  cardQuotaBase: "2:3:4",
  gopaymethod: "VBank",
  acceptmethod: "HPP(1):below1000",
  merchantData: "m",
};

const urls = {
  closeUrl: "https://v3.example.com/close",
};

describe("buildInicisFields", () => {
  it("결제 서버 응답과 구매자 정보로 이니시스 폼 값을 만들고 금액은 입력값을 쓴다", () => {
    expect(buildInicisFields(15500, init, pay, urls)).toEqual({
      currency: "WON",
      price: "15500",
      buyername: "홍길동",
      goodsname: "빅버드 머니 충전",
      buyertel: "01012345678",
      buyeremail: "adv@example.com",
      timestamp: "1730000000000",
      signature: "sig",
      mKey: "mkey",
      version: "1.0",
      mid: "INIpayTest",
      oid: "oid-1",
      returnUrl: "https://pay.example.com/client/result",
      closeUrl: "https://v3.example.com/close",
      quotabase: "2:3:4",
      gopaymethod: "VBank",
      acceptmethod: "HPP(1):below1000",
      merchantData: "m",
    });
  });

  it("없는 값은 빈 문자열로 둔다", () => {
    const fields = buildInicisFields(
      1000,
      { encryptUserIdx: "enc" },
      { ...pay, cardQuotaBase: null, merchantData: undefined },
      urls,
    );
    expect(fields.buyername).toBe("");
    expect(fields.quotabase).toBe("");
    expect(fields.merchantData).toBe("");
  });
});

describe("openInicisPayment", () => {
  afterEach(() => {
    delete window.INIStdPay;
    document.getElementById("SendPayForm_bigbird")?.remove();
  });

  it("스크립트가 없으면 던진다", () => {
    expect(() => openInicisPayment({ price: "1000" })).toThrow();
  });

  it("숨은 폼을 만들어 결제창을 열고 다음 결제 때 폼을 교체한다", () => {
    const payFn = vi.fn();
    window.INIStdPay = { pay: payFn };

    openInicisPayment({ price: "1000", oid: "a" });
    openInicisPayment({ price: "2000", oid: "b" });

    expect(payFn).toHaveBeenCalledTimes(2);
    expect(payFn).toHaveBeenCalledWith("SendPayForm_bigbird");
    const forms = document.querySelectorAll("#SendPayForm_bigbird");
    expect(forms).toHaveLength(1);
    expect(
      forms[0]?.querySelector<HTMLInputElement>("[name=price]")?.value,
    ).toBe("2000");
  });
});

describe("loadInicisScript", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.head.querySelectorAll("script").forEach((el) => el.remove());
  });

  it("응답이 없으면 시간 초과로 실패하고 스크립트를 지워 다시 시도할 수 있다", async () => {
    vi.useFakeTimers();
    const url = "https://stdpay.example.com/INIStdPay.js";

    const first = loadInicisScript(url);
    const rejected = expect(first).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(10_000);
    await rejected;
    expect(document.head.querySelector(`script[src="${url}"]`)).toBeNull();

    // 실패한 요청은 캐시에서 빠져 다음 시도가 새로 불러옴.
    void loadInicisScript(url).catch(() => undefined);
    expect(document.head.querySelector(`script[src="${url}"]`)).not.toBeNull();
  });

  it("불러오면 같은 주소는 한 번만 요청한다", async () => {
    const url = "https://stdpay.example.com/once.js";

    const first = loadInicisScript(url);
    const second = loadInicisScript(url);
    document.head
      .querySelector<HTMLScriptElement>(`script[src="${url}"]`)
      ?.onload?.(new Event("load"));

    await expect(first).resolves.toBeUndefined();
    expect(second).toBe(first);
    expect(document.head.querySelectorAll(`script[src="${url}"]`)).toHaveLength(
      1,
    );
  });
});

describe("getChargeDeviceType", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari", "MOBILE"],
    [
      "Mozilla/5.0 (Linux; Android 14; SM-S918N) Chrome/120 Mobile Safari",
      "MOBILE",
    ],
    [
      "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) Mobile/15E148 Safari",
      "MOBILE",
    ],
    ["Mozilla/5.0 (Linux; Android 14; SM-X900) Chrome/120 Safari", "PC"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", "PC"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", "PC"],
  ])("%s → %s", (userAgent, expected) => {
    expect(getChargeDeviceType(userAgent)).toBe(expected);
  });
});

describe("submitInicisMobilePayment", () => {
  it("서버 값을 숨은 폼에 넣어 paymentUrl로 EUC-KR POST 전송한다", () => {
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
    submitInicisMobilePayment({
      paymentUrl: "https://mobile.inicis.com/smart/payment/",
      form: { P_MID: "INIpayTest", P_AMT: 100000, P_NOTI_URL: null },
    });
    const form = document.getElementById(
      "SendPayForm_bigbird_mobile",
    ) as HTMLFormElement;
    expect(form.action).toBe("https://mobile.inicis.com/smart/payment/");
    expect(form.method).toBe("post");
    expect(form.acceptCharset).toBe("EUC-KR");
    expect(Object.fromEntries(new FormData(form).entries())).toEqual({
      P_MID: "INIpayTest",
      P_AMT: "100000",
      P_NOTI_URL: "",
    });
    expect(submit).toHaveBeenCalledOnce();
    submit.mockRestore();
  });
});
