import { cn } from "@/shared/lib";

import S3_DOTS from "../assets/s3-dots.png";
import S3_LOGOS_BOTTOM from "../assets/s3-logos-bottom.png";
import S3_LOGOS_TOP from "../assets/s3-logos-top.png";
import { REVEAL } from "../lib/tw";
import { section3 } from "../model/data";

interface Props {
  className?: string;
}

// The design gives one 1770x126 image holding both rows, each with blank margins
// (top row 247px left / 274px right). Tiling it as-is would add the two margins
// at the seam and leave a hole of 500px+ between logos. So each row was cut,
// its margins removed, and only the row's average logo gap (60px top / 52px
// bottom) kept on the right - the seam gap now equals the gap inside the row.
//
// The rows differ in width, so scroll time scales with width to match speed. The
// keyframes live in the global stylesheet (Tailwind has no scoped keyframes).
// opacity 50% is from the design.
const ROW = "h-[63px] bg-repeat-x opacity-50 motion-reduce:animate-none";

export function IntroSection3({ className }: Props) {
  return (
    // On MO the side margin is only on the title and description; on the section
    // it would inset the logo strip by 20px and leave the ends looking empty.
    // Background #343a40 = bigbird/text.
    <section
      className={cn(
        "relative flex flex-col items-center gap-15 overflow-hidden bg-[#343a40] py-25 max-introtab:gap-8 max-introtab:py-20 max-mo:py-15",
        className,
      )}
    >
      {/* Dot/arc pattern. The design lays a light-gray-on-white image over the dark
          plane; laid as-is it would brighten the whole plane. invert flips the
          tones and screen blending keeps the dark plane while only the pattern
          stays bright.

          Sizes are the design's: PC 1440x497 (x=0), TAB 1322x456 (x=-277), MO
          1236x427 (x=-438). All share the ratio 2.897, and the designer cropped
          the sides by hand on narrow screens. So the width is not fitted to the
          section: it stays at those widths, centered, and the overflow is cropped.
          Stretching with inset:0 + 100% 100% would squash the pattern vertically
          as the width changes. min-w-full stops the sides going empty above 1440,
          and aspect keeps the ratio then.

          The source png is 1024x512 (2:1), unlike the node's ratio - the design
          stretches it, so background-size 100% 100% reproduces the same. */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 aspect-[1440/497] w-[1440px] min-w-full -translate-x-1/2 [background-size:100%_100%] opacity-80 mix-blend-screen invert max-introtab:w-[1322px] max-mo:w-[1236px]"
        style={{ backgroundImage: `url(${S3_DOTS})` }}
        aria-hidden="true"
      />

      {/* max-w-[512px] is the design's title width. */}
      <div
        className={cn(
          REVEAL,
          "relative flex max-w-[512px] flex-col items-center gap-4 text-center max-mo:max-w-80 max-mo:px-5",
        )}
        data-reveal=""
      >
        <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep text-white max-mo:text-2xl">
          {section3.title}
        </h2>
        <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#adb5bd] max-mo:text-base">
          {section3.description}
        </p>
      </div>

      <div
        className={cn(REVEAL, "relative h-[126px] w-full overflow-hidden")}
        data-reveal=""
        role="img"
        aria-label="빅버드와 함께한 브랜드"
      >
        {/* repeat-x tiles the image endlessly and only the background position
            moves. Shifting by exactly one tile width puts the next tile in the
            same spot, so there is no seam. The top row moves left (8 logos), the
            bottom row the other way (11 logos); the differing counts and widths
            keep them out of step. */}
        <div
          className={cn(
            ROW,
            "animate-[intro-s3-left_29.6s_linear_infinite] [background-size:1308.6px_63px]",
          )}
          style={{ backgroundImage: `url(${S3_LOGOS_TOP})` }}
        />
        <div
          className={cn(
            ROW,
            "animate-[intro-s3-right_40s_linear_infinite] [background-size:1769.6px_63px]",
          )}
          style={{ backgroundImage: `url(${S3_LOGOS_BOTTOM})` }}
        />
      </div>
    </section>
  );
}
