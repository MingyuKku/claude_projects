import { tryit } from "radash";
import { useId, useRef, useState } from "react";

import {
  classifyFileSize,
  isAllowedUploadExtension,
  UPLOAD_EXTENSIONS,
} from "@/entities/account";
import {
  AuthButton,
  AuthSupportText,
  AuthText,
} from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import type { ChangeEvent } from "react";

type UploadErrorCode = "extension" | "size" | "upload";

const ACCEPT = UPLOAD_EXTENSIONS.map((extension) => `.${extension}`).join(",");

interface FileUploadFieldProps {
  label: string;
  isRequired?: boolean;
  fileName: string;
  upload: (file: File) => Promise<unknown>;
  onChangeUploaded: (fileName: string, fileSize: string) => void;
  className?: string;
}

/** 사업자등록증과 통신판매업 신고증 업로드가 이 형태를 함께 씀. */
export function FileUploadField({
  label,
  isRequired = false,
  fileName,
  upload,
  onChangeUploaded,
  className,
}: FileUploadFieldProps) {
  const { t } = useTranslation("features/join");
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [error, setError] = useState<UploadErrorCode | null>(null);

  async function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // 같은 파일을 다시 골라도 change가 일어나도록 비움. 실패한 업로드를 같은 파일로 재시도할 수 있어야 함.
    event.target.value = "";
    setError(null);

    if (!isAllowedUploadExtension(file.name)) {
      setError("extension");
      return;
    }
    const { label: sizeLabel, tooLarge } = classifyFileSize(file.size);
    if (tooLarge) {
      setError("size");
      return;
    }

    const [uploadError] = await tryit(upload)(file);
    if (uploadError) {
      setError("upload");
      return;
    }
    onChangeUploaded(file.name, sizeLabel);
  }

  function handleClickPicker() {
    inputRef.current?.click();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2.5">
        <AuthText size="md" isRequired={isRequired}>
          {label}
        </AuthText>
        <div className="flex w-full items-center gap-2.5">
          {/* 파일명 칸도 선택창을 엶. div가 아니라 button이어야 키보드로 닿음. */}
          <button
            type="button"
            onClick={handleClickPicker}
            aria-label={t("upload.pick", { label })}
            aria-describedby={error ? errorId : undefined}
            className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-line1 bg-light px-3"
          >
            <AuthText
              as="span"
              size="sm"
              className={cn("truncate", !fileName && "text-disabled")}
            >
              {fileName || t("upload.placeholder")}
            </AuthText>
          </button>
          <div className="h-11 min-w-19.5 shrink-0">
            <AuthButton
              color="primary"
              onClick={handleClickPicker}
              className="px-4"
            >
              <AuthText as="span" size="sm" tone="inherit">
                {t("upload.button")}
              </AuthText>
            </AuthButton>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleChangeFile}
          />
        </div>
      </div>
      {error && (
        <AuthSupportText id={errorId} state="error" role="alert">
          {t(`upload.error.${error}`)}
        </AuthSupportText>
      )}
    </div>
  );
}
