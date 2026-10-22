import { tryit } from "radash";
import { useRef, useState } from "react";

import {
  buildRequestAlarm,
  createRealtimeRequest,
  createRealtimeThread,
  formatWriteTime,
  newMessageId,
  retryRealtimeRequest,
  toCampaignCardBody,
} from "@/entities/inquiry";

import type { InquiryCampaignViewModel } from "@/entities/inquiry";
import type { SessionViewModel } from "@/entities/session";

interface Progress {
  campaignIdx: number | null;
  sequence: number;
  threadIdx: number;
  firstMessageId: string;
}

export type RequestResult =
  | { status: "requested"; threadIdx: number }
  | { status: "restFailed" }
  // REST 요청은 만들어졌지만 Firestore 상담 문서를 못 만듦. 다시 요청하면 REST를 또 만들지 않고 문서만 만듦.
  | { status: "firestoreFailed" };

/**
 * 실시간 상담 요청: REST로 문의를 만들고(`isBoardType: false`) 받은 `sequence`로 Firestore 상담 문서를 만듦.
 * Firestore만 실패하면 같은 캠페인으로 다시 요청할 때 REST 생성을 반복하지 않음.
 */
export function useRequestRealtimeConsultation(
  session: Pick<SessionViewModel, "userIdx" | "threadUserIdx" | "identifier">,
) {
  const progress = useRef<Progress | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  async function request(
    campaign: InquiryCampaignViewModel | null,
  ): Promise<RequestResult> {
    setIsRequesting(true);
    try {
      const campaignIdx = campaign?.campaignIdx ?? null;
      if (progress.current?.campaignIdx !== campaignIdx)
        progress.current = null;
      if (!progress.current) {
        const [error, created] = await tryit(createRealtimeThread)(campaignIdx);
        if (error) {
          console.error("실시간 상담 요청 생성 실패", error);
          return { status: "restFailed" };
        }
        progress.current = {
          campaignIdx,
          sequence: created.sequence,
          threadIdx: created.threadIdx,
          firstMessageId: newMessageId(),
        };
      }
      const current = progress.current;
      const requestCampaign = campaign && {
        campaignIdx: campaign.campaignIdx,
        campaignCode: campaign.campaignCode,
        productName: campaign.productName,
        mainImageUrl: campaign.imageUrl,
      };
      const [error, created] = await tryit(createRealtimeRequest)({
        threadUserIdx: session.threadUserIdx,
        userIdx: session.userIdx,
        userId: session.identifier,
        sequence: current.sequence,
        threadIdx: current.threadIdx,
        campaign: requestCampaign,
        // 캠페인 문의만 카드 메시지를 보냄. 운영 앱·v2 대화가 이 메시지로 카드를 그림.
        firstMessage: campaign
          ? { id: current.firstMessageId, body: toCampaignCardBody(campaign) }
          : null,
        now: Date.now(),
      });
      if (error) {
        console.error("실시간 상담 문서 생성 실패", error);
        return { status: "firestoreFailed" };
      }
      if (created.skipped) {
        // 서버가 새 문의 대신 기존 열린 실시간 요청을 돌려주고 상담 문서도 이미 있는 경우(예: 마감이 지나
        // 요청 실패가 된 요청). 같은 요청을 다시 요청해 새 마감과 알림을 남김. 아직 대기 중이거나 이미
        // 연결된 요청이면 아무것도 바꾸지 않음. 재요청이 실패해도 요청 실패 화면에서 다시 시도할 수 있음.
        const [retryError] = await tryit(retryRealtimeRequest)(
          {
            threadUserIdx: session.threadUserIdx,
            sequence: current.sequence,
          },
          buildRequestAlarm(
            {
              threadUserIdx: session.threadUserIdx,
              userIdx: session.userIdx,
              userId: session.identifier,
              campaign: requestCampaign,
            },
            campaign?.campaignIdx ?? null,
            formatWriteTime(Date.now()),
          ),
        );
        if (retryError) console.error("기존 요청 재요청 실패", retryError);
      }
      progress.current = null;
      return { status: "requested", threadIdx: current.threadIdx };
    } finally {
      setIsRequesting(false);
    }
  }

  return { request, isRequesting };
}
