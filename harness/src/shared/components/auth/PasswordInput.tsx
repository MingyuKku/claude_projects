import { useState } from "react";

import eyeClosed from "@/shared/assets/img/system/eye-closed.svg";
import eyeOpen from "@/shared/assets/img/system/eye-open.svg";
import { useTranslation } from "@/shared/i18n";

import { AuthInput } from "./AuthInput";

import type { AuthInputProps } from "./AuthInput";

const ICON_SIZE = 24;

interface PasswordInputProps extends Omit<AuthInputProps, "type"> {
  label: string;
  /** 입력창에 적용됨. 감싸는 요소는 높이가 고정. */
  className?: string;
}

/** 보임 상태는 이 필드 안에서만 쓰이므로 끌어올리지 않음. */
export function PasswordInput({
  label,
  className,
  ...props
}: PasswordInputProps) {
  const { t } = useTranslation();
  const [isHidden, setIsHidden] = useState(true);

  function handleClickToggle() {
    setIsHidden((value) => !value);
  }

  return (
    <div className="relative h-11 w-full">
      <AuthInput
        {...props}
        type={isHidden ? "password" : "text"}
        aria-label={label}
        className={className}
      />
      <button
        type="button"
        aria-label={t(isHidden ? "password.show" : "password.hide", { label })}
        onClick={handleClickToggle}
        className="absolute top-1/2 right-3 size-6 -translate-y-1/2"
      >
        <img
          src={isHidden ? eyeClosed : eyeOpen}
          alt=""
          width={ICON_SIZE}
          height={ICON_SIZE}
        />
      </button>
    </div>
  );
}
