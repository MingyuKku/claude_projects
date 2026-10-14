import { useState } from "react";

import eyeClosed from "@/shared/assets/img/system/eye-closed.svg";
import eyeOpen from "@/shared/assets/img/system/eye-open.svg";
import { cn } from "@/shared/lib";

import { AuthInput } from "./AuthInput";

import type { AuthInputProps } from "./AuthInput";

const ICON_SIZE = 24;

interface PasswordInputProps extends Omit<AuthInputProps, "type"> {
  label: string;
  /** Applied to the input; the wrapper keeps its fixed height. */
  className?: string;
}

/** Visibility state only matters inside this field, so it is not lifted. */
export function PasswordInput({
  label,
  className,
  ...props
}: PasswordInputProps) {
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
        className={cn(className)}
      />
      <button
        type="button"
        aria-label={isHidden ? `${label} 보기` : `${label} 숨기기`}
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
