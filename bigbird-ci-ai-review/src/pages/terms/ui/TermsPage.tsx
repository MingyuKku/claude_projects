import { useNavigate, useSearchParams } from "react-router";

import {
  PRIVACY_POLICY_CONTENT,
  TERMS_OF_SERVICE_CONTENT,
  TermsContent,
} from "@/entities/terms";
import { AuthHeader } from "@/shared/components/auth";

const TERMS_TYPE_PARAM = "type";
const PRIVACY_TYPE = "privacy";

const TERMS_DETAIL = {
  service: { title: "이용약관", content: TERMS_OF_SERVICE_CONTENT },
  privacy: { title: "개인정보처리방침", content: PRIVACY_POLICY_CONTENT },
} as const;

/** Full terms text opened from the login footer; `?type=privacy` opens the privacy policy. */
export function TermsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { title, content } =
    TERMS_DETAIL[
      params.get(TERMS_TYPE_PARAM) === PRIVACY_TYPE ? "privacy" : "service"
    ];

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background">
      <title>약관 </title>
      <div className="flex min-h-0 w-80 flex-1 flex-col tablet:w-96">
        <AuthHeader title={title} onClickBack={() => navigate(-1)} />
        <div className="min-h-0 flex-1 overflow-y-auto pt-[30px] pb-10">
          <div className="flex flex-col gap-4 rounded-[20px] border border-gray-200 bg-light p-5">
            <TermsContent content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
