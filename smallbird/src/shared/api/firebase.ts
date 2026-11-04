import { z } from "zod";

import { ENV } from "@/shared/config";

import { serverApiV3 } from "./clients";
import { deviceHeaders } from "./device-id";

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const firebaseTokenSchema = z.object({
  result: z.literal(true),
  token: z.string().min(1),
});

let appPromise: Promise<{ app: FirebaseApp; db: Firestore }> | null = null;
let authPromise: Promise<Auth> | null = null;
let signInPromise: Promise<void> | null = null;
// 로그아웃마다 올림. 로그아웃 전에 시작한 로그인이 뒤늦게 끝나 이전 계정으로 남지 않게 함.
let signInGeneration = 0;

/**
 * 헬프데스크 Firestore. 고객센터에서만 쓰므로 SDK를 처음 호출할 때 동적 import해서
 * 다른 화면 번들에 넣지 않는다. 동시에 여러 번 불러도 초기화는 한 번만 한다.
 * 쿼리·리스너보다 먼저 백엔드 커스텀 토큰으로 Firebase에 로그인한다.
 */
export async function getFirestoreDb(): Promise<Firestore> {
  appPromise ??= connectFirestore().catch((error: unknown) => {
    // 실패를 캐시하면 새로고침 전까지 복구할 수 없으므로, 다음 호출에서 다시 시도하게 둔다.
    appPromise = null;
    throw error;
  });
  const { app, db } = await appPromise;
  signInPromise ??= signIn(app);
  await signInPromise;
  return db;
}

/**
 * 이 기기의 Firebase 토큰·채팅방 잠금을 서버에서 풀어 달라고 요청함(로그아웃 직전, 가이드 2026-11-03 5번).
 * 실패해도 로그아웃은 이어서 해야 하므로 오류를 던지지 않고 로그만 남김.
 */
export async function revokeFirebaseToken(): Promise<void> {
  try {
    await serverApiV3.post("/help/firebase-token/revoke", undefined, {
      headers: deviceHeaders(),
    });
  } catch (error) {
    console.error("Firebase 토큰 해제 실패", error);
  }
}

/** 로그아웃·계정 전환 때 Firebase 로그인도 끊음. Firestore를 쓴 적 없으면 아무것도 하지 않음. */
export async function signOutFirebase(): Promise<void> {
  signInGeneration += 1;
  signInPromise = null;
  if (!authPromise) return;
  const [auth, { signOut }] = await Promise.all([
    authPromise,
    import("firebase/auth"),
  ]);
  await signOut(auth).catch((error: unknown) => {
    console.error("Firebase 로그아웃 실패", error);
  });
}

async function connectFirestore() {
  // 동적 import(청크 로드)가 실패할 수 있어 위에서 재시도를 허용한다.
  const [{ getApps, initializeApp }, { getFirestore }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
  ]);
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: ENV.firebaseApiKey,
      authDomain: ENV.firebaseAuthDomain,
      projectId: ENV.firebaseProjectId,
      appId: ENV.firebaseAppId,
    });
  return { app, db: getFirestore(app) };
}

/**
 * 토큰 UID는 `client-{threadUserIdx}`. 로그인은 메모리에만 두어 새로고침·다른 계정 로그인 뒤
 * 이전 계정의 Firebase 로그인이 남지 않게 함. 실패해도 지금 규칙(if true)에서는 Firestore가 동작하므로
 * 로그만 남기고 진행함(규칙을 좁히면 이 로그가 원인). 실패는 로그아웃·새로고침 전까지 다시 시도하지 않음.
 */
async function signIn(app: FirebaseApp): Promise<void> {
  // import·Auth 초기화를 기다리는 사이의 로그아웃도 잡도록 시작할 때 세대를 잡음.
  const generation = signInGeneration;
  try {
    const {
      initializeAuth,
      inMemoryPersistence,
      signInWithCustomToken,
      signOut,
    } = await import("firebase/auth");
    authPromise ??= Promise.resolve(
      initializeAuth(app, { persistence: inMemoryPersistence }),
    );
    const auth = await authPromise;
    const { token } = firebaseTokenSchema.parse(
      await serverApiV3.post("/help/firebase-token", undefined, {
        headers: deviceHeaders(),
      }),
    );
    if (generation !== signInGeneration) return;
    await signInWithCustomToken(auth, token);
    // 로그인하는 사이 로그아웃했으면 늦게 끝난 이전 계정 로그인을 다시 끊음.
    if (generation !== signInGeneration) await signOut(auth);
  } catch (error) {
    console.error("Firebase 로그인 실패", error);
  }
}
