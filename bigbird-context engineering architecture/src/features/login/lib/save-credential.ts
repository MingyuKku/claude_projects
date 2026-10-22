// PasswordCredential은 Chromium 전용이라 TypeScript DOM 타입에 없다. 필요한 만큼만 선언한다.
interface PasswordCredentialConstructor {
  new (data: { id: string; password: string }): Credential;
}

declare global {
  interface Window {
    PasswordCredential?: PasswordCredentialConstructor;
  }
}

/**
 * 로그인 성공 직후 브라우저에 비밀번호 저장을 직접 요청한다.
 * Chrome은 페이지 이동 없이 화면만 바뀌는 로그인을 성공으로 알아채지 못할 때가 있어서
 * 폼 제출만으로는 저장 제안이 뜨지 않는다. 지원하지 않는 브라우저에서는 아무것도 하지 않는다.
 */
export function offerToSavePassword(id: string, password: string) {
  const { PasswordCredential } = window;
  if (!PasswordCredential || !navigator.credentials) return;

  navigator.credentials
    .store(new PasswordCredential({ id, password }))
    .catch((error: unknown) => {
      // 저장 제안 실패는 로그인 결과와 무관하므로 흐름을 막지 않고 기록만 남긴다.
      console.warn("[login] 비밀번호 저장 제안 실패", error);
    });
}
