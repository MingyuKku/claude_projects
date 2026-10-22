import { useRef } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { ChangeEvent } from "react";

// Figma 마이페이지 파일 행(6964:89534): 파일명을 보여 주는 읽기 전용 Input과 outline "업로드" 버튼.
// 형식·용량 검사는 도메인 규칙이라 호출하는 쪽이 하고, 이 컴포넌트는 고른 파일만 넘김.
interface FileUploadInputProps {
  /** 입력 칸에 보일 이름. 고른 파일명이나 등록 상태 문구. */
  fileName: string;
  buttonLabel: string;
  /** 같은 화면에 업로드 버튼이 여럿일 때 구분하는 이름(예: "사업자 등록증 업로드"). */
  buttonAriaLabel?: string;
  accept: string;
  onPickFile: (file: File) => void;
  disabled?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export function FileUploadInput({
  fileName,
  buttonLabel,
  buttonAriaLabel,
  accept,
  onPickFile,
  disabled,
  ...controlProps
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    if (file) onPickFile(file);
  }

  return (
    <div className="flex items-center gap-2">
      <Input {...controlProps} readOnly disabled={disabled} value={fileName} />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-label={buttonAriaLabel}
        onClick={() => fileInputRef.current?.click()}
      >
        {buttonLabel}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={handleChangeFile}
      />
    </div>
  );
}
