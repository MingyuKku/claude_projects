import { tryit } from "radash";
import { useRef, useState } from "react";

import {
  classifyFileSize,
  isAllowedUploadExtension,
  UPLOAD_EXTENSIONS,
} from "@/entities/account";
import { AuthButton, AuthText } from "@/shared/components/auth";
import { cn } from "@/shared/lib";

import { UPLOAD_ERRORS } from "../model/constants";

import type { ChangeEvent } from "react";

const ACCEPT = UPLOAD_EXTENSIONS.map((extension) => `.${extension}`).join(",");

interface FileUploadFieldProps {
  label: string;
  isRequired?: boolean;
  fileName: string;
  upload: (file: File) => Promise<unknown>;
  onChangeUploaded: (fileName: string, fileSize: string) => void;
  className?: string;
}

/** The business registration and mail-order report uploads share this shape. */
export function FileUploadField({
  label,
  isRequired = false,
  fileName,
  upload,
  onChangeUploaded,
  className,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");

    if (!isAllowedUploadExtension(file.name)) {
      setError(UPLOAD_ERRORS.extension);
      return;
    }
    const { label: sizeLabel, tooLarge } = classifyFileSize(file.size);
    if (tooLarge) {
      setError(UPLOAD_ERRORS.size);
      return;
    }

    const [uploadError] = await tryit(upload)(file);
    if (uploadError) {
      setError(UPLOAD_ERRORS.upload);
      return;
    }
    onChangeUploaded(file.name, sizeLabel);
  }

  function handleClickPicker() {
    inputRef.current?.click();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <AuthText size="md" required={isRequired}>
        {label}
      </AuthText>
      <div className="flex w-full items-center gap-2">
        {/* The file name box opens the picker too; a button (not a div) keeps it keyboard reachable. */}
        <button
          type="button"
          onClick={handleClickPicker}
          aria-label={`${label} 파일 선택`}
          className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-line1 bg-light px-3"
        >
          <AuthText
            as="span"
            size="md"
            className={cn(
              "truncate",
              fileName ? "text-gray-700!" : "text-gray-400!",
            )}
          >
            {fileName || "이미지를 업로드 해주세요."}
          </AuthText>
        </button>
        <div className="h-11 min-w-[78px] shrink-0">
          <AuthButton
            color="primary"
            onClick={handleClickPicker}
            className="px-4"
          >
            <AuthText as="span" size="md" className="text-inherit!">
              업로드
            </AuthText>
          </AuthButton>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && (
        <AuthText size="sm" role="alert" className="text-negative!">
          {error}
        </AuthText>
      )}
    </div>
  );
}
