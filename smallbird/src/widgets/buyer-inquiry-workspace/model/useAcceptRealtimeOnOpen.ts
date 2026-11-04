import { useEffect } from "react";

import { acceptInquiryRealtime } from "@/entities/inquiry";

import type { ConsultationConnection } from "@/entities/inquiry";

const ACCEPTED_KEY = "bigbird.acceptedRealtime";

// 수락한 문의 번호. 새로고침해도 다시 보내지 않도록 탭의 sessionStorage에 둠(다시 보내면 서버가 msgResponseDate를 또 씀).
// 상담 문서의 `acceptedAt`으로 이미 연결됐는지 알면(connection) 보내지 않음. 상담 문서를 읽을 수 없으면(missing: 서버 반영 전·
// 문서 없음) 알 수 없으므로 이 탭 기록만 믿음(다른 탭·기기에서 처음 열면 한 번 더 보냄).
function readAccepted(): Set<number> {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(ACCEPTED_KEY) ?? "[]",
    );
    return new Set(
      Array.isArray(saved)
        ? saved.filter((value) => typeof value === "number")
        : [],
    );
  } catch {
    return new Set();
  }
}

// 이 페이지에서 보내는 중이거나 보낸 문의. 저장하지 못해도 이 페이지 안에서는 한 번만 보냄.
const attempted = new Set<number>();

function saveAccepted(idx: number) {
  try {
    sessionStorage.setItem(
      ACCEPTED_KEY,
      JSON.stringify([...readAccepted(), idx]),
    );
  } catch {
    // 저장하지 못하면 이 페이지 안에서만 한 번 보냄.
  }
}

/**
 * 구매자·인플루언서 실시간 요청을 광고주가 열면 수락함(`PUT /v3/help/inquiry/{inquiryIdx}/realtime/accept`,
 * 백엔드 흐름도 프론트팀 가이드 2026-11-03). Firestore에는 쓰지 않고 서버가 `msgResponseDate`를 씀.
 * 이미 연결된 상담(`connected`)과 상담 문서를 받는 중(`unknown`)에는 보내지 않고, 문의마다 한 번만 보냄. 탭이 가려진 채
 * 열렸으면 보이게 될 때 보냄. 실패하면 다음에 열 때 다시 시도함.
 */
export function useAcceptRealtimeOnOpen(
  inquiryIdx: number | null,
  connection: ConsultationConnection = "missing",
) {
  useEffect(() => {
    if (inquiryIdx === null) return;
    if (connection === "connected" || connection === "unknown") return;
    const idx = inquiryIdx;

    function accept() {
      if (document.hidden || attempted.has(idx) || readAccepted().has(idx))
        return;
      attempted.add(idx);
      acceptInquiryRealtime(idx)
        .then(() => saveAccepted(idx))
        .catch((error: unknown) => {
          attempted.delete(idx);
          console.error("실시간 상담 수락 실패", error);
        });
    }

    accept();
    document.addEventListener("visibilitychange", accept);
    return () => document.removeEventListener("visibilitychange", accept);
  }, [inquiryIdx, connection]);
}
