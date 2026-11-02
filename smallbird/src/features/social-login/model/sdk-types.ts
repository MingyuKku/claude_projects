// 실제로 호출하는 SDK 범위만 선언함. 제공사가 타입을 주지 않고,
// 더 선언해도 런타임 보장 없이 유지 비용만 늘기 때문.

interface NaverLoginModule {
  init: () => void;
  authorize: () => void;
  getLoginStatus: (callback: (status: boolean) => void) => void;
  /** 로그인 중일 때만 채워짐. */
  user: { id: string; email: string };
}

interface NaverSdk {
  LoginWithNaverId: new (options: {
    clientId: string;
    isPopup: string;
    callbackUrl: string;
    callbackHandle: boolean;
  }) => NaverLoginModule;
}

/** 키 이름은 카카오 규격을 따름. */
export interface KakaoProfile {
  id: number;
  kakao_account?: { email?: string };
}

interface KakaoSdk {
  isInitialized: () => boolean;
  init: (appKey: string) => void;
  Auth: {
    login: (options: {
      success: (response: unknown) => void;
      fail: () => void;
    }) => void;
  };
  API: {
    request: (options: {
      url: string;
      success: (response: KakaoProfile) => void;
      fail: () => void;
    }) => void;
  };
}

interface GoogleSdk {
  accounts?: {
    oauth2: {
      initCodeClient: (options: {
        client_id: string;
        scope: string;
        ux_mode: string;
        redirect_uri: string;
      }) => { requestCode: () => void };
    };
  };
}

interface AppleSdk {
  auth: {
    init: (options: {
      clientId: string;
      scope: string;
      redirectURI: string;
      responseMode: string;
      usePopup: boolean;
    }) => void;
    signIn: () => void;
  };
}

declare global {
  interface Window {
    naver?: NaverSdk;
    Kakao?: KakaoSdk;
    google?: GoogleSdk;
    AppleID?: AppleSdk;
  }
}
