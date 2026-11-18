import { ArrowLeft } from "lucide-react";

import askKakaoIcon from "@/shared/assets/img/auth/ask-kakao-icon.svg";
import { AuthHeading, AuthText } from "@/shared/components/auth";
import { KAKAO_CHAT_URL } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import { QUESTION_PHONE_NUMBER } from "../model/constants";

interface QuestionPanelProps {
  onClickClose: () => void;
}

/**
 * 기존 문의 탭은 정의된 적 없는 스타일 클래스를 참조해 꾸밈 없이 렌더됨.
 * 이 컴포넌트는 내용(제목, 카카오 상담, 전화, 운영 시간)만 남기고 인증 토큰으로
 * 만든 임시 화면이며, 간격과 색은 디자인을 기다림.
 */
export function QuestionPanel({ onClickClose }: QuestionPanelProps) {
  const { t } = useTranslation("pages/login");
  const { t: tCommon } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onClickClose}
        aria-label={tCommon("action.back")}
        className="flex size-6 items-center justify-center"
      >
        <ArrowLeft className="size-6 text-gray-700" />
      </button>

      <div className="flex flex-col gap-5 rounded-auth-xl bg-light p-6 shadow-normal">
        <div className="flex flex-col items-center gap-4">
          <AuthHeading type="subtitle-2" as="h2" tone="heading">
            {t("question.title")}
          </AuthHeading>
          <img src={askKakaoIcon} alt="" className="size-16" />
          <a
            href={KAKAO_CHAT_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-12 w-full items-center justify-center rounded-auth-lg bg-kakao-bg"
          >
            <AuthText as="span" className="text-kakao-text">
              {t("question.kakao")}
            </AuthText>
          </a>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-gray-200 pt-5">
          <a href={`tel:${QUESTION_PHONE_NUMBER}`}>
            <AuthText as="span" size="lg" weight="medium" tone="heading">
              {t("question.tel", { phone: QUESTION_PHONE_NUMBER })}
            </AuthText>
          </a>
          <AuthText
            size="sm"
            tone="muted"
            className="text-center whitespace-pre-line"
          >
            {t("question.hours")}
          </AuthText>
        </div>
      </div>
    </div>
  );
}
