import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { setupI18n } from "./i18n";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found");

// 언어 결정과 번역 리소스 로딩이 끝난 뒤 렌더함(한국어 → 다른 언어 깜빡임 방지).
// 초기화에 실패해도 빈 화면보다 낫도록 오류를 남기고 렌더함.
void setupI18n()
  .catch((error: unknown) => {
    console.error("[i18n] 초기화에 실패했습니다.", error);
  })
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
