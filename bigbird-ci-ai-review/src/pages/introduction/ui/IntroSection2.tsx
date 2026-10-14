import { cn } from "@/shared/lib";

import S2_BG from "../assets/s2-bg.jpg";
import { REVEAL } from "../lib/tw";
import { section2 } from "../model/data";

interface Props {
  className?: string;
}

// Divider between partners; its direction differs per screen.
//   PC  : 2 vertical lines between partners
//   TAB : 1 horizontal line under Samsung + 1 vertical line between AWS and Google
//   MO  : 2 horizontal lines between the stacked cells
// Lines are 3px (white at 10%) and absolutely positioned, so they take no layout
// width, same as the zero-width line nodes in the design.
const DIVIDER =
  "before:absolute before:top-1/2 before:left-[calc(-41px/2-1.5px)] before:h-[126px] before:w-[3px] before:-translate-y-1/2 before:bg-white/10 before:content-['']";

// Logo coordinates are the design's values; cell and image sizes differ per
// partner, hence a table.
const PARTNER = {
  samsung: {
    // Only Samsung lays its logos and caption out in a row on TAB, spanning two
    // cells. The line under it is a fixed 604px wide, centered in the 16px gap
    // between the two rows; a border-top per cell would break at the column gap.
    // MO is one column, so it has no such line.
    root: "max-introtab:col-span-full max-introtab:flex-row max-introtab:justify-center max-introtab:gap-6 max-mo:flex-col max-mo:gap-[14px] max-introtab:after:absolute max-introtab:after:top-[calc(100%+8px-1.5px)] max-introtab:after:left-1/2 max-introtab:after:h-[3px] max-introtab:after:w-[604px] max-introtab:after:-translate-x-1/2 max-introtab:after:bg-white/10 max-introtab:after:content-[''] max-mo:after:content-none",
    logo: "",
    imgs: [
      // 'SAMSUNG Fit My Marketing'
      "top-[9.29px] left-[28px] h-[33.207px] w-[147.357px]",
      // Samsung Electronics wordmark
      "top-[54.95px] left-[57.06px] h-[64.339px] w-[175.173px]",
    ],
  },
  aws: {
    // TAB has no vertical line before AWS. On MO each cell keeps only a top
    // border (border 3px + pt 21 = the design's 24px).
    root: `${DIVIDER} max-introtab:before:content-none max-mo:gap-[13px] max-mo:border-t-[3px] max-mo:border-white/10 max-mo:pt-[21px]`,
    logo: "max-introtab:h-[90.585px] max-introtab:w-[184px]",
    imgs: [
      "top-[-14.71px] left-5 h-[156.406px] w-[219.946px] max-introtab:top-[-10.41px] max-introtab:left-[14.15px] max-introtab:h-[110.688px] max-introtab:w-[155.654px]",
    ],
  },
  google: {
    // The TAB inner vertical line sits in the middle of the 24px column gap. A
    // border-left on the Google cell would start 12px right of that and run up to
    // the horizontal line.
    root: `${DIVIDER} max-introtab:before:left-[calc(-24px/2-1.5px)] max-mo:before:content-none max-mo:border-t-[3px] max-mo:border-white/10 max-mo:pt-[21px]`,
    logo: "max-introtab:h-[90.585px] max-introtab:w-[184px]",
    imgs: [
      "top-[-21.71px] left-1/2 h-[191.304px] w-[253.328px] translate-x-[calc(-50%-0.34px)] max-introtab:top-[-15.36px] max-introtab:h-[135.384px] max-introtab:w-[179.278px] max-introtab:translate-x-[calc(-50%-0.24px)]",
    ],
  },
} as const;

export function IntroSection2({ className }: Props) {
  return (
    <section
      className={cn(
        "relative flex flex-col items-center justify-center gap-12 overflow-hidden py-25 max-introtab:gap-8 max-introtab:px-10 max-introtab:py-20 max-mo:px-5 max-mo:py-15",
        className,
      )}
    >
      {/* Background: the designer's final composite as one image. Rebuilding the
          fills in CSS (blue tint + vertical gradient + photo at 20% opacity) hid
          the photo, because the export is pre-exposure-correction and nearly
          white, and 20% of that leaves a 4/255 contrast.
          Kept as cover to preserve the ratio: the frame ratio differs a lot per
          screen (PC 1.72 / TAB 0.93 / MO 0.34) against the 2880x1670 source, so
          cover fills at the cost of cropping the sides. The real fix is portrait
          photos for TAB and MO, pending the designer.
          The url() is inline because Tailwind's generated CSS is not resolved
          relative to the component. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${S2_BG})` }}
        aria-hidden="true"
      />

      <img
        className={cn(
          REVEAL,
          "relative h-[180px] w-[448px] max-introtab:h-[152px] max-introtab:w-[378px] max-mo:h-[128.677px] max-mo:w-80",
        )}
        data-reveal=""
        src={section2.awards}
        alt="2015 중소기업청 기업청장상, 특허청 특허 등록"
        loading="lazy"
      />

      <div
        className={cn(
          REVEAL,
          "relative flex flex-col items-center gap-4 text-center",
        )}
        data-reveal=""
      >
        {/* max-w-[280px]: the design breaks MO into 2 lines. */}
        <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep text-white max-mo:max-w-[280px] max-mo:text-2xl">
          {section2.title}
        </h2>
        <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#adb5bd] max-mo:text-base">
          {section2.description}
        </p>
      </div>

      {/* TAB is two rows: Samsung (horizontal) / divider / AWS and Google in 2
          columns. flex-wrap would scramble the order, so a grid places them. */}
      <div
        className={cn(
          REVEAL,
          "relative flex items-center justify-center gap-[41px] rounded-[20px] border-2 border-white/10 px-[54px] py-10",
          "max-introtab:grid max-introtab:w-full max-introtab:grid-cols-2 max-introtab:gap-x-6 max-introtab:gap-y-4 max-introtab:px-0 max-introtab:py-6",
          "max-mo:grid-cols-1 max-mo:gap-6 max-mo:py-8",
        )}
        data-reveal=""
      >
        {section2.partners.map((partner) => {
          const conf = PARTNER[partner.key];
          return (
            <div
              key={partner.key}
              className={cn(
                // On MO the logo-to-caption gap is a tight 13-14px.
                "relative flex w-[260px] flex-col items-center gap-6 max-introtab:w-auto max-introtab:gap-[23px] max-mo:gap-[14px]",
                conf.root,
              )}
            >
              <div
                className={cn(
                  "relative h-32 w-[260px] overflow-hidden",
                  conf.logo,
                )}
              >
                {partner.logos.map((logo, logoIndex) => (
                  // max-w-none: preflight's img{max-width:100%} would squash the logo.
                  <img
                    key={logo}
                    className={cn("absolute max-w-none", conf.imgs[logoIndex])}
                    src={logo}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
              <p className="m-0 text-center text-sm leading-[1.4] font-medium whitespace-pre-line text-[#adb5bd]">
                {partner.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
