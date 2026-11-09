import { payApi, serverApiV3 } from "@/shared/api";
import { ENV } from "@/shared/config";

import {
  buildInicisFields,
  getChargeDeviceType,
  loadInicisScript,
  openInicisPayment,
  submitInicisMobilePayment,
} from "../lib/inicis";
import { buildChargePaths } from "../lib/redirect-uri";
import { PAY_REQUEST_PATH, PAYMENT_METHOD_TYPE } from "../model/constants";
import {
  chargeInitSchema,
  mobilePayResponseSchema,
  payResponseSchema,
} from "../model/schema";

/**
 * 빅버드 머니 충전 요청. 결제 서버는 V3가 프록시하지 않아 프론트가 직접 부름(docs/mypage-api.md §2).
 * 1) `GET /v3/mypage/bigbird-money/init`으로 암호화된 사용자 값과 구매자 정보를 받고
 * 2) 결제 서버 v3 전용 API로 결제 정보를 받아(현재 도메인 `origin`과 복귀·닫기 경로를 보냄)
 * 3) PC는 이니시스 표준결제 스크립트를 불러와 결제창을 열고, 휴대폰은(PC용 결제창이 휴대폰을 막음) 서버가 준 모바일 폼을
 *    이니시스로 같은 창에서 전송함. 결제 뒤에는 `redirectUri`로 돌아옴.
 * `returnPath`를 넘기면 결제 뒤 마이페이지 대신 그 화면으로 돌아옴. 어느 단계든 실패하면 던짐.
 */
export async function requestCharge(amount: number, returnPath?: string) {
  const init = chargeInitSchema.parse(
    await serverApiV3.get("/mypage/bigbird-money/init"),
  );
  const { origin } = window.location;
  const { redirectUri, closeUrl } = buildChargePaths(returnPath);
  const deviceType = getChargeDeviceType();
  const isMobile = deviceType === "MOBILE";
  const response = await payApi.post(PAY_REQUEST_PATH, {
    encryptUserIdx: init.encryptUserIdx,
    price: amount,
    // 서버 문서: null이면 500, true면 삼성페이만 허용되므로 반드시 false.
    isSSPayFlag: false,
    paymentMethodType: PAYMENT_METHOD_TYPE,
    deviceType,
    origin,
    redirectUri,
    // 모바일은 팝업이 아니라 페이지가 통째로 넘어가므로 닫기 주소가 필요 없음.
    ...(isMobile ? {} : { closeUrl }),
  });

  if (isMobile) {
    submitInicisMobilePayment(mobilePayResponseSchema.parse(response));
    return;
  }

  const pay = payResponseSchema.parse(response);
  await loadInicisScript(ENV.inicisStdPayUrl);
  // `returnUrl`은 서버가 정해 응답으로 줌. `closeUrl`은 서버가 `origin`과 경로로 만든 주소를 쓰고, 응답에 없으면 같은 규칙으로 직접 만듦.
  openInicisPayment(
    buildInicisFields(amount, init, pay, {
      closeUrl: String(pay.closeUrl ?? `${origin}${closeUrl}`),
    }),
  );
}
