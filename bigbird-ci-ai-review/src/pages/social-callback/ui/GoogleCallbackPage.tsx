import {
  completeGoogleLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function GoogleCallbackPage() {
  return (
    <SocialCallbackScreen
      run={() => completeGoogleLogin(window.location.search)}
    />
  );
}
