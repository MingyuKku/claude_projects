interface ImportMetaEnv {
  readonly VITE_API_SERVER_URL: string;
  readonly VITE_API_MEMBER_URL: string;
  readonly VITE_API_SOCIAL_URL: string;
  readonly VITE_API_AUTH_URL: string;
  readonly VITE_OAUTH_REDIRECT_URL: string;
  readonly VITE_NAVER_CLIENT_ID: string;
  readonly VITE_KAKAO_APP_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_APPLE_CLIENT_ID: string;
  readonly VITE_APPLE_REDIRECT_URL: string;
  readonly VITE_DOMAIN: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
