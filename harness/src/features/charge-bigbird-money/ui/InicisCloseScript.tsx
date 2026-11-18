import { useEffect } from "react";

import { ENV } from "@/shared/config";

import { buildInicisCloseScriptUrl } from "../lib/inicis-close";

interface InicisCloseScriptProps {
  /** 표준결제 스크립트 주소. 닫기 스크립트는 같은 호스트에서 불러옴. */
  stdPayUrl?: string;
}

// 이니시스 결제창의 `closeUrl`로 열리는 페이지가 그리는 것. 결제창 안(레이어)에서 열려 이니시스 닫기 스크립트를 불러
// 결제창이 스스로 닫히게 함. 화면에는 아무것도 그리지 않음. 허용한 이니시스 호스트가 아니면 불러오지 않음.
export function InicisCloseScript({
  stdPayUrl = ENV.inicisStdPayUrl,
}: InicisCloseScriptProps) {
  useEffect(() => {
    const src = buildInicisCloseScriptUrl(stdPayUrl);
    if (!src) return;
    const script = document.createElement("script");
    script.src = src;
    script.charset = "UTF-8";
    document.head.appendChild(script);
    return () => script.remove();
  }, [stdPayUrl]);

  return null;
}
