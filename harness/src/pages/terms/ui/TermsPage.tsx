import { useNavigate, useSearchParams } from "react-router";

import { TermsDocument } from "@/entities/terms";
import { AuthHeader } from "@/shared/components/auth";
import { HISTORY_BACK, TERMS_TYPE, TERMS_TYPE_PARAM } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

// 제목은 `common` 의 `link.*` 번역을 쓰고, 본문은 현재 언어의 약관(`entities/terms`).
const TERMS_TITLE_KEY = {
  [TERMS_TYPE.service]: "link.terms",
  [TERMS_TYPE.privacy]: "link.privacy",
} as const;

/** 로그인 푸터에서 여는 약관 전문 화면. `?type=privacy`면 개인정보처리방침을 엶. */
export function TermsPage() {
  const { t } = useTranslation("pages/terms");
  const { t: tCommon } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const kind =
    params.get(TERMS_TYPE_PARAM) === TERMS_TYPE.privacy
      ? TERMS_TYPE.privacy
      : TERMS_TYPE.service;

  function handleClickBack() {
    void navigate(HISTORY_BACK);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background">
      <title>{t("title")}</title>
      <div className="flex min-h-0 w-80 flex-1 flex-col tablet:w-96">
        <AuthHeader
          title={tCommon(TERMS_TITLE_KEY[kind])}
          onClickBack={handleClickBack}
        />
        <div className="min-h-0 flex-1 overflow-y-auto pt-[30px] pb-10">
          <div className="flex flex-col gap-4 rounded-[20px] border border-gray-200 bg-light p-5">
            <TermsDocument kind={kind} />
          </div>
        </div>
      </div>
    </div>
  );
}
