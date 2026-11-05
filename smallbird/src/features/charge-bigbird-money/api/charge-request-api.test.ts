import { waitFor } from "@testing-library/react";

import { payApi, serverApiV3 } from "@/shared/api";

import { PAY_REQUEST_PATH } from "../model/constants";
import { requestCharge } from "./charge-request-api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn() },
    payApi: { post: vi.fn() },
  };
});

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

const initBody = {
  email: "adv@example.com",
  name: "홍길동",
  phone_number: "01012345678",
  encryptUserIdx: "enc",
};

function useUserAgent(userAgent: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
}

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockResolvedValue(initBody);
  vi.mocked(payApi.post).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.INIStdPay;
  document.body.innerHTML = "";
});

describe("requestCharge", () => {
  it("휴대폰이면 MOBILE로 요청하고 closeUrl을 보내지 않으며, 받은 폼을 paymentUrl로 EUC-KR 전송한다", async () => {
    useUserAgent(IPHONE_UA);
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
    vi.mocked(payApi.post).mockResolvedValueOnce({
      paymentUrl: "https://mobile.inicis.com/smart/payment/",
      form: { P_MID: "INIpayTest", P_GOODS: "빅버드 머니 충전", P_NOTI: null },
    });

    await requestCharge(15500);

    const [path, body] = vi.mocked(payApi.post).mock.calls[0] ?? [];
    expect(path).toBe(PAY_REQUEST_PATH);
    expect(body).toMatchObject({
      encryptUserIdx: "enc",
      price: 15500,
      deviceType: "MOBILE",
    });
    expect(body).not.toHaveProperty("closeUrl");

    expect(submit).toHaveBeenCalledOnce();
    const form = document.querySelector("form");
    expect(form?.action).toBe("https://mobile.inicis.com/smart/payment/");
    expect(form?.acceptCharset).toBe("EUC-KR");
    expect(
      Object.fromEntries(new FormData(form ?? undefined).entries()),
    ).toEqual({ P_MID: "INIpayTest", P_GOODS: "빅버드 머니 충전", P_NOTI: "" });
  });

  it("휴대폰인데 모바일 응답 모양이 아니면 결제창으로 보내지 않고 던진다", async () => {
    useUserAgent(IPHONE_UA);
    const submit = vi.spyOn(HTMLFormElement.prototype, "submit");
    vi.mocked(payApi.post).mockResolvedValueOnce({ form: {} });

    await expect(requestCharge(15500)).rejects.toThrow();
    expect(submit).not.toHaveBeenCalled();
  });

  it("PC면 PC로 요청하고 closeUrl을 보낸 뒤 표준결제 창을 연다", async () => {
    useUserAgent(MAC_UA);
    const pay = vi.fn();
    window.INIStdPay = { pay };
    vi.mocked(payApi.post).mockResolvedValueOnce({
      mid: "INIpayTest",
      version: "1.0",
      returnUrl: "https://pay.example.com/client/result",
      signature: "sig",
      timestamp: 1730000000000,
      mKey: "mkey",
      oid: "oid-1",
    });

    const charging = requestCharge(15500);
    // 표준결제 스크립트가 붙으면 불러온 것으로 처리함(jsdom은 외부 스크립트를 받지 않음).
    const script = await waitFor(() => {
      const found = document.head.querySelector("script");
      if (!found) throw new Error("script not appended");
      return found;
    });
    script.onload?.(new Event("load"));
    await charging;

    const [, body] = vi.mocked(payApi.post).mock.calls[0] ?? [];
    expect(body).toMatchObject({ deviceType: "PC" });
    expect(body).toHaveProperty("closeUrl");
    expect(pay).toHaveBeenCalledOnce();
  });
});
