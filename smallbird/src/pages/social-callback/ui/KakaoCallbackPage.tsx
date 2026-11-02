import {
  completeKakaoLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function KakaoCallbackPage() {
  return <SocialCallbackScreen completeLogin={() => completeKakaoLogin()} />;
}
