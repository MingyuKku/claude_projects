import { afterEach, describe, expect, it, vi } from "vitest";

import { offerToSavePassword } from "./save-credential";

describe("offerToSavePassword", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.PasswordCredential;
  });

  it("지원하는 브라우저에서는 아이디·비밀번호를 저장 요청한다", () => {
    const store = vi.fn(() => Promise.resolve(null));
    vi.stubGlobal("navigator", { credentials: { store } });
    window.PasswordCredential = class {
      constructor(public data: { id: string; password: string }) {}
    } as never;

    offerToSavePassword("tester", "pw1234!");

    expect(store).toHaveBeenCalledWith(
      expect.objectContaining({ data: { id: "tester", password: "pw1234!" } }),
    );
  });

  it("지원하지 않는 브라우저에서는 아무것도 하지 않는다", () => {
    expect(() => offerToSavePassword("tester", "pw1234!")).not.toThrow();
  });
});
