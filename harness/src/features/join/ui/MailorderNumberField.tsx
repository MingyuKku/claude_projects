import { AuthInput, AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";

import {
  isComposingInput,
  replaceMailorderPart,
  sanitizeMailorderPart,
} from "../lib/mailorder";
import {
  MAILORDER_REGION_INDEX,
  MAILORDER_SERIAL_INDEX,
  MAILORDER_YEAR_INDEX,
} from "../model/constants";

import type { MailorderIndex, MailorderParts } from "../lib/mailorder";
import type { ChangeEvent, CompositionEvent } from "react";

interface MailorderNumberFieldProps {
  parts: MailorderParts;
  onChangeParts: (parts: MailorderParts) => void;
}

/** 통신판매업 신고번호를 연도·지역·일련번호 세 칸으로 입력받음. */
export function MailorderNumberField({
  parts,
  onChangeParts,
}: MailorderNumberFieldProps) {
  const { t } = useTranslation("features/join");

  function handleChangePart(index: MailorderIndex, value: string) {
    onChangeParts(
      replaceMailorderPart(parts, index, sanitizeMailorderPart(index, value)),
    );
  }

  // 한글 조합 중에는 미완성 자모가 `가-힣` 범위 밖이라, 걸러 내면 조합이 깨짐.
  // 조합 중에는 입력값을 그대로 두고 조합이 끝난 뒤에 거름.
  function handleChangeRegion(event: ChangeEvent<HTMLInputElement>) {
    if (isComposingInput(event.nativeEvent)) {
      onChangeParts(
        replaceMailorderPart(parts, MAILORDER_REGION_INDEX, event.target.value),
      );
      return;
    }
    handleChangePart(MAILORDER_REGION_INDEX, event.target.value);
  }

  function handleCompositionEndRegion(
    event: CompositionEvent<HTMLInputElement>,
  ) {
    handleChangePart(MAILORDER_REGION_INDEX, event.currentTarget.value);
  }

  return (
    <div className="flex flex-col gap-2">
      <AuthText size="md">{t("company.mailorderNumber")}</AuthText>
      <div className="flex w-full gap-2.5">
        <div className="h-11 min-w-0 flex-1">
          <AuthInput
            inputMode="numeric"
            aria-label={t("company.mailorderYear")}
            value={parts[MAILORDER_YEAR_INDEX]}
            onChange={(event) =>
              handleChangePart(MAILORDER_YEAR_INDEX, event.target.value)
            }
          />
        </div>
        <div className="h-11 min-w-0 flex-1">
          <AuthInput
            aria-label={t("company.mailorderRegion")}
            placeholder={t("company.regionPlaceholder")}
            value={parts[MAILORDER_REGION_INDEX]}
            onChange={handleChangeRegion}
            onCompositionEnd={handleCompositionEndRegion}
          />
        </div>
        <div className="h-11 min-w-0 flex-1">
          <AuthInput
            inputMode="numeric"
            aria-label={t("company.mailorderSerial")}
            value={parts[MAILORDER_SERIAL_INDEX]}
            onChange={(event) =>
              handleChangePart(MAILORDER_SERIAL_INDEX, event.target.value)
            }
          />
        </div>
      </div>
      <AuthText size="sm" tone="faint">
        {t("company.regionHint")}
      </AuthText>
    </div>
  );
}
