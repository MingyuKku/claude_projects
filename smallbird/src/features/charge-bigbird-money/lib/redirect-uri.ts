import { ROUTES } from "@/shared/config";

/**
 * 결제 서버에 보내는 도메인(`origin`)과 두 경로. 서버는 허용 도메인 검사 없이 `origin` + 경로로 이니시스에
 * 넘길 주소를 만듦. 이니시스는 `returnUrl`·`closeUrl`의 도메인이 결제를 요청한 페이지와 같아야 해서 `origin`은 현재 도메인.
 * - `redirectUri`: 결제가 끝난 뒤 돌아올 화면. 서버가 뒤에 `?isPaid=true&…`를 문자열로 이어 붙이므로 기본(마이페이지 빅버드 머니)은 쿼리 없이 보냄(탭 기본값이 충전 내역).
 *   `returnPath`는 쿼리 없는 경로를 넘길 것: 서버가 `?isPaid=…`를 그대로 이어 붙이므로 쿼리가 있으면 `?`가 겹칠 수 있음(캠페인 등록은 `/campaign/register/:id`).
 * - `returnUrl`(이니시스가 결제 결과를 보내는 결제 서버 주소)은 서버가 정해 응답으로 주므로 보내지 않음.
 * - `closeUrl`: 결제창을 닫을 때 결제창 안에서 열리는 페이지. 이니시스 닫기 스크립트로 결제창만 닫고 충전 화면은 그대로 둠.
 */
export function buildChargePaths(returnPath: string = ROUTES.mypageMoney) {
  return {
    redirectUri: returnPath,
    closeUrl: ROUTES.inicisClose,
  };
}
