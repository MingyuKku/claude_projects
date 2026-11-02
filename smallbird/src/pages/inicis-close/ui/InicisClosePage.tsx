import { InicisCloseScript } from "@/features/charge-bigbird-money";

// 이니시스 결제창의 `closeUrl`. 로그인 확인이나 셸 없이 결제창만 닫는 페이지라 라우트를 레이아웃 밖에 둠.
export function InicisClosePage() {
  return <InicisCloseScript />;
}
