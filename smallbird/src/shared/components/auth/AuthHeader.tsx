import { cva } from "class-variance-authority";

import arrowLeft from "@/shared/assets/img/system/arrow-left.svg";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { AuthHeading } from "./AuthHeading";

/**
 * 인증 화면 상단 헤더. 모바일과 태블릿 이상은 구조가 달라 헤더 두 벌을 렌더함.
 *
 * 모바일 헤더는 w-80 컨테이너를 벗어나 뷰포트 전체 너비를 씀.
 * `ml-[calc(50%-50dvw)]`는 부모가 가운데 정렬일 때 부모 너비와 상관없이
 * 헤더를 뷰포트 왼쪽 끝에 붙임.
 */

const PERCENT = 100;

const mobileHeaderVariants = cva(
  "sticky top-0 z-10 ml-[calc(50%-50dvw)] flex h-16 w-dvw flex-col justify-between bg-background px-5 pt-5 tablet:hidden",
  {
    variants: {
      hasBorder: { true: "border-b border-gray-200", false: "" },
    },
  },
);

const tabletHeaderVariants = cva(
  "sticky top-0 z-10 hidden flex-col gap-5 bg-background tablet:flex tablet:w-96 tablet:pt-[70px] desktop:pt-30",
  {
    variants: {
      hasBorder: { true: "border-b border-gray-200 tablet:pb-5", false: "" },
    },
  },
);

const mobileRowVariants = cva("flex w-full items-center", {
  variants: {
    isBackHidden: { true: "justify-center", false: "" },
  },
});

const mobileTitleVariants = cva("", {
  variants: {
    isBackHidden: { true: "", false: "flex-1 text-center" },
  },
});

interface ProgressBarProps {
  /** 0~1 */
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="flex w-full flex-col items-start">
      {/* 렌더마다 바뀌는 런타임 값이라 클래스로 만들 수 없음. */}
      <div
        className="h-[3px] bg-gradient-to-r from-[#4B80C2] to-[#805AB1]"
        style={{ width: `${progress * PERCENT}%` }}
      />
      <div className="h-px w-full bg-gray-200" />
    </div>
  );
}

interface BackButtonProps {
  onClick: () => void;
}

function BackButton({ onClick }: BackButtonProps) {
  const { t } = useTranslation();

  return (
    <button type="button" aria-label={t("action.back")} onClick={onClick}>
      <img src={arrowLeft} alt="" className="size-6" />
    </button>
  );
}

interface AuthHeaderProps {
  title: string;
  onClickBack: () => void;
  isBackHiddenOnMobile?: boolean;
  /** 0~1. 주면 제목 아래에 진행 막대를 보여 줌. */
  progress?: number;
  /** 탭 같은 자체 구분선이 있는 화면용: 기본 아래 테두리를 없앰. */
  isBorderHidden?: boolean;
  className?: string;
}

export function AuthHeader({
  title,
  onClickBack,
  isBackHiddenOnMobile = false,
  progress,
  isBorderHidden = false,
  className,
}: AuthHeaderProps) {
  const hasBorder = progress === undefined && !isBorderHidden;

  return (
    <>
      <header className={cn(mobileHeaderVariants({ hasBorder }), className)}>
        <div
          className={mobileRowVariants({ isBackHidden: isBackHiddenOnMobile })}
        >
          {!isBackHiddenOnMobile && <BackButton onClick={onClickBack} />}
          <AuthHeading
            type="subtitle-1"
            as="h1"
            tone="heading"
            className={mobileTitleVariants({
              isBackHidden: isBackHiddenOnMobile,
            })}
          >
            {title}
          </AuthHeading>
          {!isBackHiddenOnMobile && <div className="size-6" />}
        </div>
        {progress !== undefined && <ProgressBar progress={progress} />}
      </header>

      <header className={cn(tabletHeaderVariants({ hasBorder }), className)}>
        <div className="flex items-center justify-between">
          <BackButton onClick={onClickBack} />
          <AuthHeading type="subtitle-1" as="h1" tone="heading">
            {title}
          </AuthHeading>
          <div className="size-6" />
        </div>
        {progress !== undefined && <ProgressBar progress={progress} />}
      </header>
    </>
  );
}
