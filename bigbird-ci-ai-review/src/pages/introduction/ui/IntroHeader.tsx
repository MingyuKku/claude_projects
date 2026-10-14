import { cn } from "@/shared/lib";

import { CONTAINER } from "../lib/tw";
import { header } from "../model/data";

interface Props {
  /** Hero shrink progress, 0 to 1. */
  progress: number;
  className?: string;
}

// The ghost button has no fill or blur - only its text sits on the hero (a
// backdrop-blur showed through as a pill shape). Its text color changes with
// scroll, so that is driven by the inline style below, not by a class.
const VARIANT = {
  primary: "rounded-[4px] bg-[#1a1b1c] text-white",
  ghost: "",
  secondary: "",
} as const;

// Ghost text goes from white (255) to #222 (34): a span of 221.
const GHOST_CHANNEL_START = 255;
const GHOST_CHANNEL_RANGE = 221;

export function IntroHeader({ progress, className }: Props) {
  const ghostChannel = GHOST_CHANNEL_START - GHOST_CHANNEL_RANGE * progress;

  return (
    // sticky + the hero's negative margin-top.
    //
    // With fixed, the header would be sized against the viewport (1440) while the
    // body sits in a scroll container narrowed by the scrollbar (1425), leaving
    // the header logo 7px off the sections' left edge. Sticky uses the container,
    // so they align, but it takes 72px of flow; the hero cancels that with
    // -mt-[72px] so it starts at y=0.
    <header className={cn("sticky top-0 z-10 h-[72px]", className)}>
      <div
        className="absolute inset-0 border-b border-[#adb5bd] bg-white"
        style={{ opacity: progress }}
      />
      <div
        className={cn(
          CONTAINER,
          "relative flex h-full items-center justify-between",
        )}
      >
        {/* Display only: clicking the logo goes nowhere (product decision). */}
        <div className="relative block h-[26.37px] w-[120px] shrink-0">
          <img
            className="absolute inset-0 size-full"
            src={header.logoLight}
            alt="Bigbird"
            style={{ opacity: 1 - progress }}
          />
          <img
            className="absolute inset-0 size-full"
            src={header.logoDark}
            alt=""
            style={{ opacity: progress }}
          />
        </div>

        {/* gap: 24px on PC/TAB, 8px on MO. */}
        <div className="flex shrink-0 items-center gap-6 max-mo:gap-2">
          {header.buttons.map((button) => (
            <a
              key={button.label}
              className={cn(
                // On MO the two buttons are fixed at 96px / 81px wide, which works
                // out to 16px side padding; 24px would overflow a 360px viewport.
                "flex h-10 items-center justify-center px-6 py-3 text-center text-sm leading-[21px] font-bold whitespace-nowrap no-underline max-mo:px-4",
                VARIANT[button.variant],
              )}
              href={button.href}
              style={
                button.variant === "ghost"
                  ? {
                      color: `rgb(${ghostChannel}, ${ghostChannel}, ${ghostChannel})`,
                    }
                  : undefined
              }
            >
              {button.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
