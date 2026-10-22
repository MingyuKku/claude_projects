import { tryit } from "radash";
import { useNavigate } from "react-router";

import {
  clearLoginCredential,
  formLogin,
  useNavigateToLanding,
} from "@/entities/session";
import { ROUTES } from "@/shared/config";

/**
 * 비밀번호 변경을 미룬 뒤, 사용자가 원래 하려던 로그인을 이어서 진행함.
 * 자격 증명이 없거나 로그인에 실패하면 로그인 화면으로 돌려보냄.
 */
export function useRelogin() {
  const navigate = useNavigate();
  const navigateToLanding = useNavigateToLanding();

  return async function relogin(id: string, password: string | undefined) {
    if (!password) {
      void navigate(ROUTES.login);
      return;
    }
    const [error, data] = await tryit(formLogin)(id, password);
    clearLoginCredential();
    if (error || !data.result) {
      void navigate(ROUTES.login);
      return;
    }
    navigateToLanding();
  };
}
