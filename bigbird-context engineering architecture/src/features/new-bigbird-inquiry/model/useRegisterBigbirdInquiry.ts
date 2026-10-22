import { tryit } from "radash";
import { useRef, useState } from "react";

import {
  createBigbirdInquiry,
  sendInquiryMessage,
  startInquiryUploads,
  toCampaignCardBody,
} from "@/entities/inquiry";

import type { InquiryCampaignViewModel } from "@/entities/inquiry";

interface Progress {
  threadIdx: number;
  isCampaignCardSent: boolean;
  isBodySent: boolean;
}

type RegisterResult =
  | { status: "registered"; threadIdx: number }
  | { status: "createFailed" }
  // 문의는 만들어졌지만 캠페인 카드나 본문을 보내지 못함. 다시 제출하면 남은 단계만 보냄.
  | { status: "messageFailed" };

/**
 * 문의 남기기 등록: 문의 생성 → (캠페인 문의면) 캠페인 카드 auto 메시지 → 본문(있으면). 첨부는 이 흐름이 끝난 뒤
 * 백그라운드 업로드(`startInquiryUploads`)로 넘겨 화면 이동을 막지 않음.
 * v2가 보내던 "기타문의"·인사말 auto 메시지는 보내지 않음(사용자 결정 2026-10-16).
 * 생성에 성공한 뒤 실패하면 생성부터 다시 하지 않고, 같은 폼에서 다시 제출할 때 남은 단계만 보냄.
 */
export function useRegisterBigbirdInquiry() {
  const progress = useRef<Progress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function register(
    campaign: InquiryCampaignViewModel | null,
    body: string,
    files: readonly File[] = [],
  ): Promise<RegisterResult> {
    setIsSubmitting(true);
    try {
      if (!progress.current) {
        const [error, created] = await tryit(createBigbirdInquiry)(
          campaign?.campaignIdx ?? null,
        );
        if (error) {
          console.error("빅버드 문의 생성 실패", error);
          return { status: "createFailed" };
        }
        progress.current = {
          threadIdx: created.threadIdx,
          isCampaignCardSent: false,
          isBodySent: false,
        };
      }
      const current = progress.current;
      if (campaign && !current.isCampaignCardSent) {
        const [error] = await tryit(sendInquiryMessage)({
          threadIdx: current.threadIdx,
          body: toCampaignCardBody(campaign),
          isAuto: true,
        });
        if (error) {
          console.error("캠페인 카드 메시지 전송 실패", error);
          return { status: "messageFailed" };
        }
        current.isCampaignCardSent = true;
      }
      if (body.trim() && !current.isBodySent) {
        const [error] = await tryit(sendInquiryMessage)({
          threadIdx: current.threadIdx,
          body,
        });
        if (error) {
          console.error("문의 본문 전송 실패", error);
          return { status: "messageFailed" };
        }
        current.isBodySent = true;
      }
      // 첨부는 기다리지 않음. 대화 화면으로 먼저 넘기고, 업로드는 스토어가 이어서 하며 그 화면이 진행을 보여 줌.
      startInquiryUploads(current.threadIdx, [...files]);
      // 등록이 끝난 문의의 진행 상태를 남기면, 같은 훅에서 다시 제출할 때 새 문의를 만들지 않고
      // 이 스레드에 본문만 또 보냄.
      progress.current = null;
      return { status: "registered", threadIdx: current.threadIdx };
    } finally {
      setIsSubmitting(false);
    }
  }

  return { register, isSubmitting };
}
