import { ArrowLeft } from "lucide-react";

import askKakaoIcon from "@/shared/assets/img/auth/ask-kakao-icon.svg";
import { AuthHeading, AuthText } from "@/shared/components/auth";
import { KAKAO_CHAT_URL } from "@/shared/config";

import { QUESTION_HOURS, QUESTION_PHONE_NUMBER } from "../model/constants";

/**
 * The legacy inquiry tab referenced style classes that were never defined, so it
 * rendered unstyled. This is a stand-in built from the auth tokens that keeps only
 * the content (title, Kakao consult, phone, hours); spacing and colors are pending
 * a design.
 */

interface QuestionPanelProps {
  onClickClose: () => void;
}

export function QuestionPanel({ onClickClose }: QuestionPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onClickClose}
        aria-label="뒤로가기"
        className="flex size-6 items-center justify-center"
      >
        <ArrowLeft className="size-6 text-gray-700" />
      </button>

      <div className="flex flex-col gap-5 rounded-xl bg-light p-6 shadow-normal">
        <div className="flex flex-col items-center gap-4">
          <AuthHeading type="subtitle-2" as="h2" className="text-heading!">
            문의
          </AuthHeading>
          <img src={askKakaoIcon} alt="" className="size-16" />
          <a
            href={KAKAO_CHAT_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-12 w-full items-center justify-center rounded-lg bg-kakao-bg"
          >
            <AuthText as="span" className="text-kakao-text!">
              카카오톡 상담하기
            </AuthText>
          </a>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-gray-200 pt-5">
          <a href={`tel:${QUESTION_PHONE_NUMBER}`}>
            <AuthText
              as="span"
              size="lg"
              weight="medium"
              className="text-heading!"
            >
              Tel. {QUESTION_PHONE_NUMBER}
            </AuthText>
          </a>
          <AuthText
            size="sm"
            className="text-center whitespace-pre-line text-gray-500!"
          >
            {QUESTION_HOURS}
          </AuthText>
        </div>
      </div>
    </div>
  );
}
