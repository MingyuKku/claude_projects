import {
  completeKakaoLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function KakaoCallbackPage() {
  return <SocialCallbackScreen run={() => completeKakaoLogin()} />;
}
