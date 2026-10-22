import { ENV } from "@/shared/config";

import type { Firestore } from "firebase/firestore";

let firestorePromise: Promise<Firestore> | null = null;

/**
 * 헬프데스크 Firestore. 고객센터에서만 쓰므로 SDK를 처음 호출할 때 동적 import해서
 * 다른 화면 번들에 넣지 않는다. 동시에 여러 번 불러도 초기화는 한 번만 한다.
 */
export function getFirestoreDb(): Promise<Firestore> {
  firestorePromise ??= connectFirestore().catch((error: unknown) => {
    // 실패를 캐시하면 새로고침 전까지 복구할 수 없으므로, 다음 호출에서 다시 시도하게 둔다.
    firestorePromise = null;
    throw error;
  });
  return firestorePromise;
}

async function connectFirestore(): Promise<Firestore> {
  // 동적 import(청크 로드)가 실패할 수 있어 위에서 재시도를 허용한다.
  const [{ getApps, initializeApp }, { getFirestore }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
  ]);

  // 익명 로그인은 하지 않는다. 헬프데스크 프로젝트는 익명 로그인이 꺼져 있어(auth/admin-restricted-operation)
  // v2·운영 앱도 실패를 무시한 채 로그인 없이 접근하고 있다. 보안 규칙을 좁힐 때 인증 방식을 따로 정한다.
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: ENV.firebaseApiKey,
      authDomain: ENV.firebaseAuthDomain,
      projectId: ENV.firebaseProjectId,
      appId: ENV.firebaseAppId,
    });
  return getFirestore(app);
}
