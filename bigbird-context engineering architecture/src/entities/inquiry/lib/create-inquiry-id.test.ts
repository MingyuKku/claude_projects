import { createInquiryId } from "./create-inquiry-id";

it("randomUUID가 없는 LAN HTTP 환경에서도 서로 다른 식별자를 생성한다", () => {
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues });
  try {
    const first = createInquiryId();
    const second = createInquiryId();
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(second).not.toBe(first);
  } finally {
    vi.unstubAllGlobals();
  }
});
