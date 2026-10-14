import arrowLeft from "@/shared/assets/img/system/arrow-left.svg";
import { cn } from "@/shared/lib";

import { AuthHeading } from "./AuthHeading";

/**
 * Auth-screen top header. Mobile and tablet+ differ structurally, so two
 * headers are rendered.
 *
 * The mobile header escapes the w-80 container to use the full viewport
 * width: `ml-[calc(50%-50dvw)]` pins it to the viewport's left edge when the
 * parent is centered, regardless of the parent's width.
 */

const PERCENT = 100;

interface ProgressBarProps {
  /** 0~1 */
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="flex w-full flex-col items-start">
      {/* Runtime value that changes per render, so it cannot be a class. */}
      <div
        className="h-[3px] bg-gradient-to-r from-[#4B80C2] to-[#805AB1]"
        style={{ width: `${progress * PERCENT}%` }}
      />
      <div className="h-px w-full bg-gray-200" />
    </div>
  );
}

interface AuthHeaderProps {
  title: string;
  onClickBack: () => void;
  hideBackOnMobile?: boolean;
  /** 0~1. When given, a progress bar is shown under the title. */
  progress?: number;
  /** For screens with their own divider (tabs etc.): removes the default bottom border. */
  hideBorder?: boolean;
  className?: string;
}

export function AuthHeader({
  title,
  onClickBack,
  hideBackOnMobile = false,
  progress,
  hideBorder = false,
  className,
}: AuthHeaderProps) {
  const hasBorder = progress === undefined && !hideBorder;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-10 ml-[calc(50%-50dvw)] flex h-16 w-dvw flex-col justify-between bg-background px-5 pt-5 tablet:hidden",
          hasBorder && "border-b border-gray-200",
          className,
        )}
      >
        <div
          className={cn(
            "flex w-full items-center",
            hideBackOnMobile && "justify-center",
          )}
        >
          {!hideBackOnMobile && (
            <button type="button" aria-label="뒤로가기" onClick={onClickBack}>
              <img src={arrowLeft} alt="" className="size-6" />
            </button>
          )}
          <AuthHeading
            type="subtitle-1"
            as="h1"
            className={cn(
              "text-heading!",
              !hideBackOnMobile && "flex-1 text-center",
            )}
          >
            {title}
          </AuthHeading>
          {!hideBackOnMobile && <div className="size-6" />}
        </div>
        {progress !== undefined && <ProgressBar progress={progress} />}
      </header>

      <header
        className={cn(
          "sticky top-0 z-10 hidden flex-col gap-5 bg-background tablet:flex tablet:w-96 tablet:pt-[70px] desktop:pt-30",
          hasBorder && "border-b border-gray-200 tablet:pb-5",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <button type="button" aria-label="뒤로가기" onClick={onClickBack}>
            <img src={arrowLeft} alt="" className="size-6" />
          </button>
          <AuthHeading type="subtitle-1" as="h1" className="text-heading!">
            {title}
          </AuthHeading>
          <div className="size-6" />
        </div>
        {progress !== undefined && <ProgressBar progress={progress} />}
      </header>
    </>
  );
}
