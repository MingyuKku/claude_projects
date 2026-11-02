import { useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";

/** 로그인 직후 첫 화면(홈)으로 보냄. 권한과 관계없이 같음(SUB도 홈). */
export function useNavigateToLanding() {
  const navigate = useNavigate();

  return function navigateToLanding() {
    void navigate(ROUTES.main);
  };
}
