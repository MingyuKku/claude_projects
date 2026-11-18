import { tryit } from "radash";
import { useState } from "react";

import {
  buildRequestAlarm,
  createRealtimeThread,
  formatWriteTime,
  sendInquiryMessage,
  startThreadRealtime,
  toCampaignCardBody,
  updateHelpdeskAccount,
} from "@/entities/inquiry";

import type { InquiryCampaignViewModel } from "@/entities/inquiry";
import type { SessionViewModel } from "@/entities/session";

export type RequestResult =
  { status: "requested"; threadIdx: number } | { status: "restFailed" };

interface CurrentThread {
  threadIdx: number;
}

/**
 * 실시간 상담 요청(가이드 2026-11-03 5번, 사용자 결정): 보고 있는 빅버드 문의(기타 문의 포함)가 열려 있으면 같은 스레드를
 * `PUT /v3/help/thread/{threadIdx}/realtime`으로 실시간 전환하고, 열린 문의가 없을 때만 `POST /v3/help/thread`
 * (`isBoardType: false`)로 새로 만듦. 상담 문서는 서버가 씀. 종료된 스레드도 같은 PUT으로 처리하며 서버가 주는 threadIdx로 감(사용자 결정 2026-11-04).
 * 운영 앱 알림을 위해 계정 문서의 프론트 필드(`alarmData` 등)만 부분 갱신함.
 */
export function useRequestRealtimeConsultation(
  session: Pick<SessionViewModel, "userIdx" | "threadUserIdx" | "identifier">,
) {
  const [isRequesting, setIsRequesting] = useState(false);

  async function request(
    campaign: InquiryCampaignViewModel | null,
    /** 지금 보고 있는 문의. 열려 있으면 같은 스레드를 전환하고, 새 스레드가 생겼을 때만 캠페인 카드를 보냄. */
    current?: CurrentThread,
  ): Promise<RequestResult> {
    setIsRequesting(true);
    try {
      const campaignIdx = campaign?.campaignIdx ?? null;
      const [error, created] = await tryit(async () =>
        current
          ? startThreadRealtime(current.threadIdx)
          : createRealtimeThread(campaignIdx),
      )();
      if (error) {
        console.error("실시간 상담 요청 생성 실패", error);
        return { status: "restFailed" };
      }
      // 종료된 캠페인 문의라 새 스레드가 생기면 운영 앱·v2 대화가 카드를 그리도록 첫 메시지로 카드를 보냄.
      const isSameThread = created.threadIdx === current?.threadIdx;
      if (campaign && !isSameThread) {
        const [cardError] = await tryit(sendInquiryMessage)({
          threadIdx: created.threadIdx,
          body: toCampaignCardBody(campaign),
          isAuto: true,
        });
        if (cardError) console.error("캠페인 카드 전송 실패", cardError);
      }
      // 알림이 실패해도 요청은 서버에 있으므로 이동함(운영 앱 목록에는 보임).
      const [alarmError] = await tryit(updateHelpdeskAccount)(
        session.threadUserIdx,
        {
          threadBoardType: 0,
          newSenderUserIdx: 1,
          currentCampaignIdx: campaignIdx,
          alarmData: buildRequestAlarm(
            {
              threadUserIdx: session.threadUserIdx,
              userIdx: session.userIdx,
              userId: session.identifier,
              campaign: campaign && {
                campaignIdx: campaign.campaignIdx,
                campaignCode: campaign.campaignCode,
                productName: campaign.productName,
                mainImageUrl: campaign.imageUrl,
              },
              sequence: created.sequence,
              threadIdx: created.threadIdx,
            },
            campaignIdx,
            formatWriteTime(Date.now()),
          ),
        },
      );
      if (alarmError) console.error("실시간 요청 알림 기록 실패", alarmError);
      return { status: "requested", threadIdx: created.threadIdx };
    } finally {
      setIsRequesting(false);
    }
  }

  return { request, isRequesting };
}
