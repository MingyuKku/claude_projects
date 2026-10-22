import {
  completeAppleLogin,
  SocialCallbackScreen,
} from "@/features/social-login";

export function AppleCallbackPage() {
  return (
    <SocialCallbackScreen
      completeLogin={() => completeAppleLogin(window.location.search)}
    />
  );
}
