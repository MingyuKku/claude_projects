import { cva } from "class-variance-authority";
import { useState } from "react";
import { useNavigate } from "react-router";

import checkWhite from "@/shared/assets/img/system/check-white.svg";
import {
  AuthHeader,
  AuthSupportText,
  AuthText,
  AuthTextButton,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { buildJoinPayload } from "../lib/build-join-payload";
import { canSubmitTerms } from "../lib/gating";
import { useSubmitJoin } from "../lib/use-submit-join";
import { JOIN_STEP_PROGRESS, TERMS_ITEMS } from "../model/constants";
import { useJoinStore } from "../model/join-store-context";
import { JoinStepFooter } from "./JoinStepFooter";
import { TermsDetailView } from "./TermsDetailView";

import type { SocialLinker } from "../lib/use-submit-join";
import type { TermsFields } from "../model/types";

interface JoinTermsStepProps {
  onLinkSocial?: SocialLinker;
}

interface CheckMarkProps {
  isChecked: boolean;
}

const checkMarkVariants = cva(
  "flex size-5 shrink-0 items-center justify-center rounded-sm border",
  {
    variants: {
      checked: {
        true: "border-primary bg-primary",
        false: "border-gray-200 bg-light",
      },
    },
  },
);

function CheckMark({ isChecked }: CheckMarkProps) {
  return (
    <span className={cn(checkMarkVariants({ checked: isChecked }))}>
      {isChecked && <img src={checkWhite} alt="" className="h-2.5 w-3" />}
    </span>
  );
}

export function JoinTermsStep({ onLinkSocial }: JoinTermsStepProps) {
  const { t } = useTranslation("features/join");
  const account = useJoinStore((state) => state.account);
  const company = useJoinStore((state) => state.company);
  const terms = useJoinStore((state) => state.terms);
  const tokenData = useJoinStore((state) => state.tokenData);
  const patchTerms = useJoinStore((state) => state.patchTerms);
  const navigate = useNavigate();
  const { isJoinFailed, isSubmitting, submit } = useSubmitJoin({
    payload: buildJoinPayload(account, company, terms),
    tokenData,
    onLinkSocial,
    onJoined: () => void navigate(ROUTES.welcome),
  });

  const [viewingTerm, setViewingTerm] = useState<keyof TermsFields | null>(
    null,
  );

  const isAllChecked = terms.service && terms.privacy;
  const canSubmit = canSubmitTerms(terms, account);
  const viewingItem = TERMS_ITEMS.find((item) => item.key === viewingTerm);

  function handleClickBack() {
    void navigate(ROUTES.login);
  }

  function handleClickAll() {
    patchTerms({ service: !isAllChecked, privacy: !isAllChecked });
  }

  function handleClickCloseTerm() {
    setViewingTerm(null);
  }

  function handleClickAgreeTerm() {
    if (!viewingTerm) return;
    patchTerms({ [viewingTerm]: true });
    setViewingTerm(null);
  }

  function handleClickSubmit() {
    if (!canSubmit) return;
    void submit();
  }

  if (viewingTerm && viewingItem) {
    return (
      <TermsDetailView
        title={t(`terms.item.${viewingItem.key}.title`)}
        kind={viewingItem.key}
        confirmLabel={t("terms.agree")}
        progress={JOIN_STEP_PROGRESS.terms}
        onClickBack={handleClickCloseTerm}
        onClickConfirm={handleClickAgreeTerm}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title={t("header")}
        onClickBack={handleClickBack}
        progress={JOIN_STEP_PROGRESS.terms}
      />

      <div className="min-h-0 flex-1 overflow-y-auto tablet:flex-none tablet:overflow-visible">
        <div className="flex flex-col gap-5 pt-7.5 tablet:gap-6 tablet:pt-6 tablet:pb-12">
          <AuthText size="xl" weight="medium" tone="heading">
            {t("terms.title")}
          </AuthText>

          <div className="flex w-full flex-col items-start">
            <button
              type="button"
              role="checkbox"
              aria-checked={isAllChecked}
              onClick={handleClickAll}
              className="flex w-full items-center gap-2 py-5 tablet:p-5"
            >
              <CheckMark isChecked={isAllChecked} />
              <AuthText as="span" size="md">
                {t("terms.all")}
              </AuthText>
            </button>

            <div className="flex w-full flex-col items-start tablet:pl-5">
              {TERMS_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex w-full items-center justify-between px-2.5 py-4 tablet:px-5"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={terms[item.key]}
                    onClick={() => patchTerms({ [item.key]: !terms[item.key] })}
                    className="flex items-center gap-2"
                  >
                    <CheckMark isChecked={terms[item.key]} />
                    <AuthText as="span" size="sm">
                      {t(`terms.item.${item.key}.label`)}
                    </AuthText>
                  </button>
                  <AuthTextButton
                    aria-label={t("terms.viewItem", {
                      label: t(`terms.item.${item.key}.label`),
                    })}
                    onClick={() => setViewingTerm(item.key)}
                  >
                    {t("terms.view")}
                  </AuthTextButton>
                </div>
              ))}
            </div>
          </div>

          {isJoinFailed && (
            <AuthSupportText state="error" role="alert">
              {t("terms.joinFailed")}
            </AuthSupportText>
          )}
        </div>
      </div>

      <JoinStepFooter
        label={t("terms.submit")}
        onClick={handleClickSubmit}
        disabled={!canSubmit || isSubmitting}
      />
    </div>
  );
}
