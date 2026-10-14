import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";

import checkWhite from "@/shared/assets/img/system/check-white.svg";
import { AuthButton, AuthHeader, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

import { joinSubmit } from "../api/join-api";
import { buildJoinPayload } from "../lib/build-join-payload";
import { canSubmitTerms } from "../lib/gating";
import {
  JOIN_FAILED_MESSAGE,
  JOIN_STEP_PROGRESS,
  TERMS_ITEMS,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";
import { TermsDetailView } from "./TermsDetailView";

import type { TermsFields } from "../model/types";

export type SocialLinker = (
  platform: string,
  userIdx: number,
  email: string,
  uid: string,
) => Promise<unknown>;

interface JoinTermsStepProps {
  onLinkSocial?: SocialLinker;
}

interface CheckMarkProps {
  isChecked: boolean;
}

function CheckMark({ isChecked }: CheckMarkProps) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded border",
        isChecked ? "border-brand bg-brand" : "border-gray-200 bg-light",
      )}
    >
      {isChecked && <img src={checkWhite} alt="" className="h-2.5 w-3" />}
    </span>
  );
}

export function JoinTermsStep({ onLinkSocial }: JoinTermsStepProps) {
  const account = useJoinStore((state) => state.account);
  const company = useJoinStore((state) => state.company);
  const terms = useJoinStore((state) => state.terms);
  const tokenData = useJoinStore((state) => state.tokenData);
  const patchTerms = useJoinStore((state) => state.patchTerms);
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingTerm, setViewingTerm] = useState<keyof TermsFields | null>(
    null,
  );

  const isAllChecked = terms.service && terms.privacy;
  const canSubmit = canSubmitTerms(terms, account);

  async function handleSubmit() {
    const payload = buildJoinPayload(account, company, terms);
    if (!canSubmit || !payload) return;
    setSubmitError("");
    setIsSubmitting(true);

    const [error, response] = await tryit(joinSubmit)(payload);
    if (error || response.result !== "success" || !response.userIdx) {
      setSubmitError(JOIN_FAILED_MESSAGE);
      setIsSubmitting(false);
      return;
    }
    if (tokenData && onLinkSocial) {
      // The account already exists, so a failed SNS link must not fail the join; it can be linked later from the account screen.
      await tryit(onLinkSocial)(
        tokenData.platform,
        response.userIdx,
        tokenData.email,
        tokenData.uid,
      );
    }
    setIsSubmitting(false);
    navigate(ROUTES.welcome);
  }

  const viewingItem = TERMS_ITEMS.find((item) => item.key === viewingTerm);
  if (viewingTerm && viewingItem) {
    return (
      <TermsDetailView
        title={viewingItem.title}
        content={viewingItem.content}
        confirmLabel="동의하기"
        progress={JOIN_STEP_PROGRESS.terms}
        onClickBack={() => setViewingTerm(null)}
        onClickConfirm={() => {
          patchTerms({ [viewingTerm]: true });
          setViewingTerm(null);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title="회원가입"
        onClickBack={() => navigate(ROUTES.login)}
        progress={JOIN_STEP_PROGRESS.terms}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-[30px] tablet:gap-6 tablet:pt-6">
          <AuthText size="xl" weight="bold" className="text-heading!">
            3. 약관 동의
          </AuthText>

          <div className="flex w-full flex-col items-start mobile:px-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={isAllChecked}
              onClick={() =>
                patchTerms({ service: !isAllChecked, privacy: !isAllChecked })
              }
              className="flex w-full items-center gap-2 px-2.5 py-2.5 mobile:px-0 tablet:px-5 tablet:py-5"
            >
              <CheckMark isChecked={isAllChecked} />
              <AuthText as="span" size="md" className="text-gray-700!">
                모든 항목에 동의합니다.
              </AuthText>
            </button>

            <div className="flex w-full flex-col items-start pl-5">
              {TERMS_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex w-full items-center justify-between px-2.5 py-2.5 mobile:px-0 tablet:px-5 tablet:py-4"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={terms[item.key]}
                    onClick={() => patchTerms({ [item.key]: !terms[item.key] })}
                    className="flex items-center gap-2"
                  >
                    <CheckMark isChecked={terms[item.key]} />
                    <AuthText as="span" size="sm" className="text-gray-700!">
                      {item.label}
                    </AuthText>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingTerm(item.key)}
                    className="border-b border-gray-300"
                  >
                    <AuthText as="span" size="sm" className="text-gray-400!">
                      보기
                    </AuthText>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {submitError && (
          <AuthText size="sm" role="alert" className="text-negative!">
            {submitError}
          </AuthText>
        )}
      </div>

      <div className="shrink-0 py-5 tablet:pb-[70px] desktop:pb-[120px]">
        <div className="h-12">
          <AuthButton
            color="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <AuthText as="span" className="text-light!">
              환영합니다
            </AuthText>
          </AuthButton>
        </div>
      </div>
    </div>
  );
}
