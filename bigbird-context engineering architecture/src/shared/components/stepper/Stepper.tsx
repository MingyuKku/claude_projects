import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
import { Fragment } from "react";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma Stepper(7225:139726): Step Symbol(Default/Active × sm/lg) 사이를 Step Trail 선으로 이음.
// Active는 완료된 단계(체크)이고, 두 Active 단계 사이의 선도 Active(primary)가 됨.
// 알려진 한계: 완료 여부가 색과 체크 아이콘(aria-hidden)으로만 전달됨. 실제 진행 안내에 쓰게 되면
// 완료 단계에 번역 가능한 sr-only 문구(예: "완료")를 prop으로 받아 추가함.
const symbolVariants = cva(
  "flex shrink-0 items-center justify-center font-medium",
  {
    variants: {
      size: {
        sm: "size-5 rounded-md text-xs leading-5 [&_svg]:size-3",
        lg: "size-10 rounded-xl text-2xl leading-10 [&_svg]:size-6",
      },
      isActive: {
        true: "bg-primary text-blue-100",
        false: "bg-blue-200 text-blue-600",
      },
    },
  },
);

const trailVariants = cva("flex min-w-px flex-1 flex-col justify-center", {
  variants: {
    size: {
      sm: "py-2.5",
      lg: "h-10",
    },
  },
});

export type StepperSize = "sm" | "lg";

export interface StepperStep {
  id: string;
  label?: ReactNode;
}

interface StepperProps {
  steps: StepperStep[];
  /** 앞에서부터 Active(완료)로 표시할 단계 수 */
  activeCount?: number;
  size?: StepperSize;
  className?: string;
}

export function Stepper({
  steps,
  activeCount = 0,
  size = "sm",
  className,
}: StepperProps) {
  return (
    <ol className={cn("flex items-start gap-0.5 px-1", className)}>
      {steps.map((step, index) => {
        const isActive = index < activeCount;
        return (
          <Fragment key={step.id}>
            {index > 0 && (
              <li aria-hidden className={trailVariants({ size })}>
                <span
                  className={cn(
                    "h-[1.5px] w-full",
                    isActive ? "bg-primary" : "bg-sidebar-border",
                  )}
                />
              </li>
            )}
            <li
              className={cn(
                "flex shrink-0 flex-col items-center",
                size === "sm" && "w-6",
              )}
            >
              <span className="flex pb-1.5">
                <span className={symbolVariants({ size, isActive })}>
                  {isActive ? (
                    // Figma 예외: 체크 선이 아이콘 크기에 비례(sm 12px→1px, lg 24px→2px)함.
                    <Check
                      aria-hidden
                      nonScalingStroke={false}
                      strokeWidth={2}
                    />
                  ) : (
                    index + 1
                  )}
                </span>
              </span>
              {step.label && (
                <span
                  className={cn(
                    "max-w-[60px] text-center text-xs leading-4 font-medium whitespace-nowrap",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
