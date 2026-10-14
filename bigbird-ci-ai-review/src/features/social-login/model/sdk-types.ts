// Only the SDK surface we actually call is declared. The providers ship no
// types, and typing more would add upkeep without any runtime guarantee.

interface NaverLoginModule {
  init: () => void;
  authorize: () => void;
  getLoginStatus: (callback: (status: boolean) => void) => void;
  /** Filled only while logged in. */
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

/** Key names follow Kakao's contract. */
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
