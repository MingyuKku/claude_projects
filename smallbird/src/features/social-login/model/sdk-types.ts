// 실제로 호출하는 SDK 범위만 선언함. 제공사가 타입을 주지 않고,
// 더 선언해도 런타임 보장 없이 유지 비용만 늘기 때문.

interface GoogleSdk {
  accounts?: {
    oauth2: {
      initCodeClient: (options: {
        client_id: string;
        scope: string;
        ux_mode: string;
        redirect_uri: string;
        state?: string;
      }) => { requestCode: () => void };
    };
  };
}

/** `signIn()`이 팝업에서 받아 resolve하는 값. 이름·이메일을 담은 `user`는 최초 승인에만 오고 서버는 ID 토큰의 이메일을 씀. */
interface AppleSignInResponse {
  authorization: { code: string; id_token: string; state?: string };
}

interface AppleSdk {
  auth: {
    init: (options: {
      clientId: string;
      scope: string;
      redirectURI: string;
      state: string;
      usePopup: boolean;
    }) => void;
    /** 팝업을 닫으면 `{ error }`로 reject됨(`popup_closed_by_user`·`user_cancelled_authorize`). */
    signIn: () => Promise<AppleSignInResponse>;
  };
}

declare global {
  interface Window {
    google?: GoogleSdk;
    AppleID?: AppleSdk;
  }
}

// 전역 선언을 쓰려면 이 파일이 모듈이어야 함.
export {};
