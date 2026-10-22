import {
  completeGoogleLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function GoogleCallbackPage() {
  return (
    <SocialCallbackScreen
      completeLogin={() => completeGoogleLogin(window.location.search)}
    />
  );
}
