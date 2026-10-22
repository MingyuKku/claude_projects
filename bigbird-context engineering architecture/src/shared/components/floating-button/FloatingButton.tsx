import { cva } from "class-variance-authority";
import { ArrowDown, ArrowUp, X } from "lucide-react";

import chatbotIcon from "@/shared/assets/img/floating/chatbot.svg";
import { cn } from "@/shared/lib/utils";

import type { ComponentProps } from "react";

// Figma Button / Floating(6982:62159). 화면 구석에 고정되는 56px 원형 버튼.
// chatbot: 닫힘 = 챗봇 아이콘, 열림(isActive) = X. scroll: 기본 = 위로, isActive = 아래로.
const floatingButtonVariants = cva(
  "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-6",
  {
    variants: {
      type: {
        chatbot: "bg-linear-to-b from-background to-blue-100",
        scroll: "bg-background",
      },
    },
    defaultVariants: { type: "chatbot" },
  },
);

interface FloatingButtonProps extends Omit<ComponentProps<"button">, "type"> {
  type?: "chatbot" | "scroll";
  isActive?: boolean;
  /** 아이콘만 있는 버튼이라 이름이 필수. */
  "aria-label": string;
}

function FloatingIcon({
  type,
  isActive,
}: Required<Pick<FloatingButtonProps, "type" | "isActive">>) {
  if (type === "scroll") return isActive ? <ArrowDown /> : <ArrowUp />;
  if (isActive) return <X className="text-primary" />;
  return <img src={chatbotIcon} alt="" className="size-7" />;
}

export function FloatingButton({
  type = "chatbot",
  isActive = false,
  className,
  ...props
}: FloatingButtonProps) {
  return (
    <button
      {...props}
      type="button"
      className={cn(floatingButtonVariants({ type }), className)}
    >
      <FloatingIcon type={type} isActive={isActive} />
    </button>
  );
}
