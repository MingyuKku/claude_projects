import { tryit } from "radash";
import { useRef, useState } from "react";

import {
  classifyFileSize,
  isAllowedUploadExtension,
  UPLOAD_EXTENSIONS,
} from "@/entities/account";
import { AuthButton, AuthText } from "@/shared/components/auth";
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
  const [error, setError] = useState<UploadErrorCode | null>(null);

  async function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
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
      <AuthText size="md" isRequired={isRequired}>
        {label}
      </AuthText>
      <div className="flex w-full items-center gap-2">
        {/* 파일명 칸도 선택창을 엶. div가 아니라 button이어야 키보드로 닿음. */}
        <button
          type="button"
          onClick={handleClickPicker}
          aria-label={t("upload.pick", { label })}
          className="flex h-11 min-w-0 flex-1 items-center rounded-auth-lg border border-line1 bg-light px-3"
        >
          <AuthText
            as="span"
            size="md"
            tone={fileName ? "default" : "faint"}
            className="truncate"
          >
            {fileName || t("upload.placeholder")}
          </AuthText>
        </button>
        <div className="h-11 min-w-[78px] shrink-0">
          <AuthButton
            color="primary"
            onClick={handleClickPicker}
            className="px-4"
          >
            <AuthText as="span" size="md" tone="inherit">
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
      {error && (
        <AuthText size="sm" role="alert" tone="negative">
          {t(`upload.error.${error}`)}
        </AuthText>
      )}
    </div>
  );
}
