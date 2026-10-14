import {
  completeAppleLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function AppleCallbackPage() {
  return (
    <SocialCallbackScreen
      run={() => completeAppleLogin(window.location.search)}
    />
  );
}
