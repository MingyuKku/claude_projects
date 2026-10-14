import { useNavigate } from "react-router";

import {
  AlertPopup,
  AuthButton,
  AuthHeader,
  AuthText,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

import { useCertAuth } from "../lib/use-cert-auth";
import {
  CERT_FAIL_FALLBACK_MESSAGE,
  CERT_INTRO_NOTICES,
  DEV_CERT_SKIP,
  JOIN_STEP_PROGRESS,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";

export function CertIntroStep() {
  const applyCertSuccess = useJoinStore((state) => state.applyCertSuccess);
  const navigate = useNavigate();
  const cert = useCertAuth(applyCertSuccess);

  function handleClickDevSkip() {
    applyCertSuccess(DEV_CERT_SKIP);
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <AuthHeader
        title="본인인증하기"
        onClickBack={() => navigate(ROUTES.login)}
        progress={JOIN_STEP_PROGRESS.cert}
      />

      <AuthText size="xl" weight="bold" className="text-heading!">
        서비스 이용을 위해
        <br />
        기업 담당자 본인인증이 필요합니다.
      </AuthText>

      <div className="h-12 w-full">
        <AuthButton color="primary" onClick={() => void cert.open()}>
          <AuthText as="span" className="text-light!">
            PASS로 본인 인증하기
          </AuthText>
        </AuthButton>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="text-gray-400! underline"
          onClick={handleClickDevSkip}
        >
          <AuthText as="span" size="sm">
            [DEV] 본인인증 건너뛰기
          </AuthText>
        </button>
      )}

      {cert.result.status === "fail" && (
        <AuthText size="sm" className="text-negative!" role="alert">
          {cert.result.message || CERT_FAIL_FALLBACK_MESSAGE}
        </AuthText>
      )}
      {cert.result.status === "exists" && (
        <AuthText size="sm" className="text-negative!" role="alert">
          이미 가입된 정보입니다
        </AuthText>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <div className="h-px flex-1 bg-gray-400" />
          <AuthText
            as="span"
            size="sm"
            weight="bold"
            className="whitespace-nowrap text-gray-400!"
          >
            잠시만요!
          </AuthText>
          <div className="h-px flex-1 bg-gray-400" />
        </div>
        {CERT_INTRO_NOTICES.map((notice) => (
          <div key={notice} className="rounded-[20px] bg-gray-100 p-5">
            <AuthText size="sm">{notice}</AuthText>
          </div>
        ))}
      </div>

      {cert.isPopupBlocked && (
        <AlertPopup
          title="팝업이 차단되었습니다"
          message="브라우저에서 팝업 차단을 해제한 뒤 다시 시도해 주세요."
          confirmLabel="확인"
          onClickConfirm={() => cert.setIsPopupBlocked(false)}
        />
      )}
    </div>
  );
}
