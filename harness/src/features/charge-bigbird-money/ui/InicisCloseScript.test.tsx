import { render } from "@testing-library/react";

import { InicisCloseScript } from "./InicisCloseScript";

const closeScripts = () =>
  document.head.querySelectorAll('script[src*="INIStdPay_close.js"]');

describe("InicisCloseScript", () => {
  it("같은 호스트의 닫기 스크립트를 불러오고 아무것도 그리지 않는다", () => {
    const { container } = render(
      <InicisCloseScript stdPayUrl="https://stgstdpay.inicis.com/stdjs/INIStdPay.js" />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(closeScripts()).toHaveLength(1);
    expect(closeScripts()[0]).toHaveAttribute(
      "src",
      "https://stgstdpay.inicis.com/stdjs/INIStdPay_close.js",
    );
  });

  it("사라질 때 스크립트를 지운다", () => {
    const { unmount } = render(
      <InicisCloseScript stdPayUrl="https://stgstdpay.inicis.com/stdjs/INIStdPay.js" />,
    );
    unmount();
    expect(closeScripts()).toHaveLength(0);
  });

  it("허용하지 않은 호스트면 스크립트를 불러오지 않는다", () => {
    render(
      <InicisCloseScript stdPayUrl="https://evil.example.com/stdjs/INIStdPay.js" />,
    );
    expect(closeScripts()).toHaveLength(0);
  });
});
