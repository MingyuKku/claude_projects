import { render } from "@testing-library/react";
import { StrictMode } from "react";

import { CertSuccessPage } from "./CertSuccessPage";

const RESULT_SEARCH = "?rec_cert=ENCRYPTED&certNum=20261026";

function renderStrict() {
  return render(
    <StrictMode>
      <CertSuccessPage />
    </StrictMode>,
  );
}

describe("CertSuccessPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // 페이지 이동(오프너 없음) 경로도 같은 가드를 지나지만, jsdom은 `location.replace`를 바꿔 끼울 수 없어 팝업 경로로 확인함
  it("StrictMode에서 effect가 두 번 돌아도 오프너에 결과를 한 번만 넘기고 창을 닫는다", () => {
    const certResult = vi.fn();
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    vi.stubGlobal("opener", { cert_result: certResult });
    window.history.replaceState(null, "", `/cert/success${RESULT_SEARCH}`);

    renderStrict();

    expect(certResult).toHaveBeenCalledTimes(1);
    expect(certResult).toHaveBeenCalledWith({
      rec_cert: "ENCRYPTED",
      certNum: "20261026",
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
