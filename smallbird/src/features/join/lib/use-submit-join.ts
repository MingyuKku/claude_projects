import { tryit } from "radash";
import { useState } from "react";

import { joinSubmit } from "../api/join-api";

import type { JoinResult } from "../model/schema";
import type { JoinPayload, SnsTokenData } from "../model/types";

export type SocialLinker = (
  platform: string,
  userIdx: number,
  email: string,
  uid: string,
) => Promise<unknown>;

interface UseSubmitJoinParams {
  payload: JoinPayload | null;
  tokenData: SnsTokenData | null;
  onLinkSocial?: SocialLinker;
  onJoined: () => void;
}

type SucceededJoinResult = JoinResult & { userIdx: number };

function isJoinSucceeded(
  response: JoinResult,
): response is SucceededJoinResult {
  return response.result === "success" && Boolean(response.userIdx);
}

/** 회원가입 제출과, SNS로 들어온 경우의 계정 연동을 맡음. */
export function useSubmitJoin({
  payload,
  tokenData,
  onLinkSocial,
  onJoined,
}: UseSubmitJoinParams) {
  const [isJoinFailed, setIsJoinFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!payload) return;
    setIsJoinFailed(false);
    setIsSubmitting(true);

    const [error, response] = await tryit(joinSubmit)(payload);
    if (error || !isJoinSucceeded(response)) {
      setIsJoinFailed(true);
      setIsSubmitting(false);
      return;
    }
    if (tokenData && onLinkSocial) {
      // 계정은 이미 만들어졌으므로 SNS 연동이 실패해도 가입은 실패로 보지 않음. 계정 화면에서 나중에 연동할 수 있음.
      await tryit(onLinkSocial)(
        tokenData.platform,
        response.userIdx,
        tokenData.email,
        tokenData.uid,
      );
    }
    setIsSubmitting(false);
    onJoined();
  }

  return { isJoinFailed, isSubmitting, submit };
}
