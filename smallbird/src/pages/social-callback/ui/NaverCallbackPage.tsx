import {
  completeNaverLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function NaverCallbackPage() {
  return <SocialCallbackScreen completeLogin={() => completeNaverLogin()} />;
}
