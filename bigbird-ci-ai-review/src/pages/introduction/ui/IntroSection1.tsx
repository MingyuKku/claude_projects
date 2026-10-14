import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib";

import { CONTAINER } from "../lib/tw";
import { section1 } from "../model/data";

interface Props {
  className?: string;
}

// Debounce for the resize flag: transitions come back 150ms after resizing stops.
const RESIZE_SETTLE_MS = 150;

// Same boundary as `--breakpoint-introtab` (1240px) in the global stylesheet;
// change them together.
const TAB_AND_BELOW_QUERY = "(max-width: 1239.98px)";

// Hover transition (design QA: Figma prototype "While hovering / Smart animate /
// Easing Slow / 400ms"). Raised from 400ms to 900ms on request to feel slower;
// the curve settles softly at the end, so the same time reads as roomier.
const HOVER = "duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]";

// Mockups and overlays do not fade: for 900ms both mockups showed through as an
// afterimage. Only one is visible at a time (opacity switches instantly) and only
// the size moves. Tailwind v4's transition-transform also covers translate and
// scale, not just transform.
const MOVE = `transition-transform ${HOVER}`;

// Mockup size and position differ per card; the numbers are the design's
// coordinates (left-1/2 + translate-x is the base, plus the offset from the card
// center).
//
// On hover the mockup grows and swaps (design QA). Because the sizes continue,
// the image swap is not noticeable:
//   entering: the hover mockup appears small and grows to full size
//   leaving : the default mockup appears enlarged and shrinks to full size
// Card 1's two mockups share a ratio (364x303 / 535x445 = 1.20), so the scale
// falls out directly: start 364/535 = 0.681, inverse 1.470.
// Cards 2 and 3 use different mockup files for default and hover, so image sizes
// do not correspond (353 -> 1208, 3.4x, would burst out of the screen). Instead
// the widths of the "phone screen" drawn on each mockup are matched - that is
// what makes the same phone look like it grows in the prototype:
//   default screen 353.1 * (433/820) = 186.4, hover screen 245
//   -> 245/186.4 = 1.32, inverse 0.76
// The scales apply on PC only: mockup coordinates differ on TAB.
const CARD = [
  {
    // Card 1: PC desktop mockup, 96.5px right of center.
    imgDefault:
      "top-[15px] h-[303px] w-[364px] translate-x-[calc(-50%+96.5px)] max-introtab:translate-x-[-50%] max-mo:translate-x-[calc(-50%+46px)] introtab:group-hover:scale-[1.47]",
    imgHover:
      "top-[30px] h-[445px] w-[535px] translate-x-[-50%] introtab:scale-[0.681] introtab:group-hover:scale-100",
  },
  {
    // Card 2 default: portrait phone mockup. The design box is 350x781 with
    // object-cover; the 1708x3778 original is wider than the box, so cover fits
    // the height and crops 1.5px per side (drawn width 353.1). The asset keeps
    // only the top 1560px, so its height is the original * (1560/3778) = 0.4129.
    imgDefault: cn(
      "top-[-16px] h-[322.5px] w-[353.1px] translate-x-[calc(-50%+0.5px)]",
      // TAB: 410x915 box, 4px left of the 688 card center.
      "max-introtab:top-[-20px] max-introtab:h-[377.8px] max-introtab:w-[413.7px] max-introtab:translate-x-[calc(-50%-4px)]",
      // MO: 354x789 box, exactly centered on the 320 card.
      "max-mo:top-[-21px] max-mo:h-[325.8px] max-mo:w-[356.7px] max-mo:translate-x-[-50%]",
      "introtab:group-hover:scale-[1.32]",
    ),
    // Cards 2 and 3 share the same Blue Mockup on hover.
    imgHover:
      "top-[-91px] h-[736px] w-[1208px] translate-x-[calc(-50%-18.5px)] introtab:scale-[0.76] introtab:group-hover:scale-100",
    // Scroll inside the mockup screen: the mockup stays and only the phone
    // "screen" is cut out, with the full capture flowing inside it.
    // The screen area was measured from the pixels of s1-mockup.png (1800x1100):
    // the bezel (rgb 50,50,57) meets the screen at x 743..1107 (width 365) and
    // y 180..931 (height 752). Converted to the 1208x736 hover mockup:
    //   left 1208 * 743/1800 = 498.6 -> -123.9px from the mockup center
    //   top  736 * 180/1100 = 120.4 -> 29.4px below the mockup top (-91px)
    //   size 245.0 x 503.2
    // At width 361 a beige strip of the baked-in screen showed through on the
    // right 4px. The measured radius is about 38 (25.5 converted), but a small
    // radius lets the overlay poke out over the bezel at the corners, so it is
    // set a bit larger to cut only inward.
    //
    // TAB and MO have no hover, so the mockup stays the default phone image; the
    // capture goes on that phone's screen and flows continuously. The screen
    // position was measured from the default mockup (820x749), the same for cards
    // 2 and 3 (they share the original): body x193..649, screen x205..637 (width
    // 433), screen top 95. Measure the width on several rows (y 200/300/500/700):
    // at y 120 the corner rounding reads 20px narrow, and the baked-in screen
    // shows through at the sides. The image is placed at different sizes per
    // screen, so values are multiplied by the render ratio (render width / 820):
    // below is for TAB at 413.7 wide (0.5045) and MO at 356.7 wide (0.435).
    screen: cn(
      "max-introtab:top-[27.9px] max-introtab:left-[calc(50%-107.4px)] max-introtab:h-[258px] max-introtab:w-[218.5px]",
      // Clipped by the 286px card image frame below, so no bottom radius.
      "max-introtab:rounded-t-[25.8px] max-introtab:rounded-b-none",
      "max-mo:top-[20.3px] max-mo:left-[calc(50%-89.2px)] max-mo:h-[266px] max-mo:w-[188.4px] max-mo:rounded-t-[22.2px]",
    ),
    // Vertical travel = capture render height - visible height + start offset.
    // Direction is one-way: scroll down, then jump back to the start (no rewind).
    // Speed is about 69px/s. The PC hover only runs while the mouse is over, where
    // 103px/s fits, but here it runs the whole time on screen and the same speed
    // looks busy, so it is 1.5x slower.
    screenVars:
      "max-introtab:[--s1-scroll-dist:-1026px] max-introtab:[--s1-scroll-dur:15s] max-mo:[--s1-scroll-dist:-841px] max-mo:[--s1-scroll-dur:12.3s]",
    screenBody: "max-introtab:top-[52.9px] max-mo:top-[45.3px]", // header 54.9 - 2
    // The 727x4096 capture is drawn 245 * 4096/727 = 1380px tall. The screen box
    // overflows below the card and is clipped, so the capture end is fitted to the
    // visible bottom line (card 436 - screen top 29.4 = 406.6):
    //   59.5 + 1380 + ty = 406.6  ->  ty = -1033
    // It flows at a constant ~103px/s once the 0.3s card growth ends. The
    // transition targets translate, not transform: Tailwind v4's translate-y uses
    // the CSS translate property, so a transform transition would not move.
    screenScroll:
      "introtab:group-hover:translate-y-[-1033px] introtab:group-hover:[transition:translate_10s_linear_0.3s]",
  },
  {
    // Card 3 default: the same mockup asset as card 2 (1708x3778 cropped to the
    // top 1560), so the values match. The design leaves only card 3 at 350x774 on
    // all three devices, 17% smaller than card 2 on TAB; treated as a design
    // omission, so it follows card 2's rule.
    imgDefault: cn(
      "top-[-16px] h-[322.5px] w-[353.1px] translate-x-[calc(-50%+0.5px)]",
      "max-introtab:top-[-20px] max-introtab:h-[377.8px] max-introtab:w-[413.7px] max-introtab:translate-x-[calc(-50%-4px)]",
      "max-mo:top-[-21px] max-mo:h-[325.8px] max-mo:w-[356.7px] max-mo:translate-x-[-50%]",
      "introtab:group-hover:scale-[1.32]",
    ),
    imgHover:
      "top-[-91px] h-[736px] w-[1208px] translate-x-[calc(-50%-18.5px)] introtab:scale-[0.76] introtab:group-hover:scale-100",
    // The mockup equals card 2's, so the screen position does too.
    screen: cn(
      "max-introtab:top-[27.9px] max-introtab:left-[calc(50%-107.4px)] max-introtab:h-[258px] max-introtab:w-[218.5px]",
      "max-introtab:rounded-t-[25.8px] max-introtab:rounded-b-none",
      "max-mo:top-[20.3px] max-mo:left-[calc(50%-89.2px)] max-mo:h-[266px] max-mo:w-[188.4px] max-mo:rounded-t-[22.2px]",
    ),
    // The capture (380x4096) and header (900x224) differ from card 2, so the
    // travel distance and start offset are set separately:
    //   TAB header 218.5 * 224/900 = 54.4 -> start 52.4
    //       capture 4096 * 218.5/380 = 2355.2, distance 2355.2 - 258 + 52.4 =
    //       2149.6 -> 31.2s at 69px/s
    //   MO  header 188.4 * 224/900 = 46.9 -> start 44.9
    //       capture 4096 * 188.4/380 = 2030.9, distance 2030.9 - 266 + 44.9 =
    //       1809.8 -> 26.2s
    screenVars:
      "max-introtab:[--s1-scroll-dist:-2150px] max-introtab:[--s1-scroll-dur:31.2s] max-mo:[--s1-scroll-dist:-1810px] max-mo:[--s1-scroll-dur:26.2s]",
    screenBody: "max-introtab:top-[52.4px] max-mo:top-[44.9px]",
    // The 380x4096 capture is drawn 245 * 4096/380 = 2641px tall:
    // 59.5 + 2641 + ty = 406.6 -> ty = -2294.
    screenScroll:
      "introtab:group-hover:translate-y-[-2294px] introtab:group-hover:[transition:translate_22.3s_linear_0.3s]",
  },
] as const;

export function IntroSection1({ className }: Props) {
  // Card index -> whether canplay arrived. Stays false if the file is missing.
  const [readyVideos, setReadyVideos] = useState<Record<number, boolean>>({});
  // Past the TAB boundary (1240px) the mockup coordinates switch between PC and
  // TAB values. The mockup has a hover transition (0.9s) but the video overlay
  // does not, so while resizing the video would jump to the new spot first and
  // the mockup trail behind. Transitions are cut only while resizing (design QA).
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    function handleResize() {
      setIsResizing(true);
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(
        () => setIsResizing(false),
        RESIZE_SETTLE_MS,
      );
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, []);

  function playVideo(index: number) {
    // play() rejects when playback conditions are not met; without a catch the
    // console shows an unhandled rejection.
    const playing = videoRefs.current[index]?.play();
    playing?.catch(() => {});
  }

  function stopVideo(index: number) {
    // On TAB and MO the video keeps running regardless of hover (design QA). A
    // narrowed desktop browser must not stop on mouseleave either, so this goes
    // by width.
    if (window.matchMedia(TAB_AND_BELOW_QUERY).matches) return;

    const element = videoRefs.current[index];
    if (!element) return;
    element.pause();
    // The next hover starts again from the beginning.
    element.currentTime = 0;
  }

  return (
    // The design's section height is PC 852 / TAB 1696 / MO 1650. The content
    // decides the height; only the design's vertical padding is reproduced here:
    // PC 100 (title y=100, and 100 below the card end 316+436=752) / TAB 80 / MO 60.
    // Background #f1f3f5 = bigbird/forms; it must be darker than the #fafafa card
    // so the card stands out.
    <section
      className={cn(
        "bg-[#f1f3f5] py-25 max-introtab:py-20 max-mo:py-15",
        // While resizing, mockup and video must move at the same instant.
        isResizing && "[&_*]:transition-none!",
        className,
      )}
    >
      <div className={CONTAINER}>
        {/* The design's title width is PC/TAB 472, MO 320. Left open, the
            description would stretch to one line instead of the design's 2/3. gap
            16 on all 3. */}
        <div className="mx-auto flex max-w-[472px] flex-col items-center gap-4 text-center max-mo:max-w-[320px]">
          {/* whitespace-pre-line keeps the title's \n (2-line break). */}
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep whitespace-pre-line text-[#222] max-mo:text-2xl">
            {section1.title}
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#868e96] max-mo:text-base">
            {section1.description}
          </p>
        </div>

        {/* Card gap 19.5 on PC, 20 on TAB/MO -> gap-5.
            mt: title end -> card start is 60 on PC, 32 on TAB and MO. */}
        <ul className="mt-15 flex list-none gap-5 p-0 max-introtab:mt-8 max-introtab:flex-col">
          {section1.cards.map((card, index) => {
            const conf = CARD[index];
            if (!conf) return null;
            return (
              <li
                key={card.title}
                className={cn(
                  // PC (row): 1200px split in 3 = 387px; height 436 on all 3.
                  // In a column, flex:1 behaves as flex-basis:0 and ignores height,
                  // splitting the container height (436 collapsed to 132), so it
                  // is turned off for the vertical layout.
                  "group relative h-[436px] min-w-0 flex-1 overflow-hidden rounded-[4px] bg-[#fafafa] px-[30px] pt-[30px] max-introtab:w-full max-introtab:flex-none",
                  // The hover effect is on only with a mouse at PC width: touch
                  // devices keep the hover state stuck after a tap, and a narrowed
                  // window would clash with the TAB effect.
                  `transition-[background] ${HOVER}`,
                  "introtab:hover:bg-[linear-gradient(180deg,#285b99_0%,#292f35_100%)]",
                )}
                onMouseEnter={() => playVideo(index)}
                onMouseLeave={() => stopVideo(index)}
              >
                {/* On hover the text disappears and the mockup fills the card. */}
                <h3
                  className={cn(
                    "relative z-[1] m-0 text-2xl leading-[1.4] font-bold text-[#222] max-mo:text-lg",
                    `transition-opacity ${HOVER}`,
                    "introtab:group-hover:opacity-0",
                  )}
                >
                  {card.title}
                </h3>
                {/* Title-to-description gap is 18px on PC/TAB and 8px on MO. */}
                <p
                  className={cn(
                    "relative z-[1] mt-[18px] mb-0 text-lg leading-[1.4] font-medium break-keep whitespace-pre-line text-[#868e96] max-mo:mt-2 max-mo:text-sm",
                    `transition-opacity ${HOVER}`,
                    "introtab:group-hover:opacity-0",
                  )}
                >
                  {card.description}
                </p>

                {/* The image frame starts at y=150 with height 436-150=286. */}
                <div
                  className={cn(
                    "absolute inset-x-0 top-[150px] h-[286px] overflow-hidden rounded-b-[4px]",
                    `transition-[top,height] ${HOVER}`,
                    "introtab:group-hover:top-0 introtab:group-hover:h-full",
                  )}
                >
                  {/* max-w-none: preflight's img{max-width:100%} would squash
                      mockups that must be laid out larger than the card (sizes
                      are the design's coordinates). */}
                  <img
                    className={cn(
                      "absolute left-1/2 max-w-none",
                      MOVE,
                      conf.imgDefault,
                      "introtab:group-hover:opacity-0",
                    )}
                    src={card.image}
                    alt=""
                    loading="lazy"
                  />
                  <img
                    className={cn(
                      "absolute left-1/2 max-w-none opacity-0",
                      MOVE,
                      conf.imgHover,
                      "introtab:group-hover:opacity-100",
                    )}
                    src={card.hoverImage}
                    alt=""
                    loading="lazy"
                  />

                  {card.screenImg && "screen" in conf && (
                    <span
                      className={cn(
                        "absolute top-[29.4px] left-[calc(50%-123.9px)] h-[503.2px] w-[245px] overflow-hidden rounded-[28.9px] opacity-0",
                        MOVE,
                        // The scale origin is the mockup center, converted to the
                        // overlay box coordinates: mockup center (50% - 18.5,
                        // -91 + 368) against overlay origin (50% - 123.9, 29.4).
                        "introtab:origin-[105.4px_247.6px] introtab:scale-[0.76] introtab:group-hover:scale-100 introtab:group-hover:opacity-100",
                        "max-introtab:opacity-100",
                        conf.screen,
                        conf.screenVars,
                      )}
                    >
                      {/* The capture starts under the header and slides up behind
                          it. It starts 2px above the header height (61.5px) and
                          overlaps slightly: butting them exactly leaves a 1px gap
                          at the seam when fractional coordinates round to
                          sub-pixels. The 0.4s transition is the return speed when
                          leaving hover. TAB and MO turn the transition off and
                          flow it continuously with an animation. */}
                      <img
                        className={cn(
                          "absolute top-[59.5px] left-0 w-full transition-transform duration-400 ease-[ease]",
                          "motion-reduce:animate-none max-introtab:animate-[intro-s1-screen-scroll_var(--s1-scroll-dur)_linear_infinite] max-introtab:transition-none",
                          conf.screenBody,
                          conf.screenScroll,
                        )}
                        src={card.screenImg}
                        alt=""
                        loading="lazy"
                      />
                      {/* Status bar + app header: a fixed layer over the image
                          frame in the design. The 900x226 original (2x of 450x113)
                          is 61.5px at the 245 screen width. */}
                      <img
                        className="absolute top-0 left-0 z-[1] w-full"
                        src={card.screenHead}
                        alt=""
                        loading="lazy"
                      />
                    </span>
                  )}

                  {/* Video playing inside the mockup screen. If the file is missing
                      canplay never arrives, so it stays hidden and the screen baked
                      into the mockup shows. The hover mockup's (535x445) screen
                      area is its own design node: left 22 / top 22 / 491x277
                      (16:9) from the mockup. The mockup sits at top:30 with
                      translateX(-50%), so
                        left = center - 267.5 + 22 = center - 245.5, top = 30 + 22 = 52
                      The mockup is 535 (design 534.587) wide, so the width is
                      491 * 535/534.587 = 491.4.
                      TAB and MO have no hover, so the mockup stays the default
                      image (364x303); the video goes on that mockup's screen
                      (measured x 16..349.5 / y 15..203, 16:9):
                        TAB: centered -> left = center - 182 + 16
                        MO : +46 from center -> left = center - 182 + 16 + 46 */}
                  {card.hoverVideo && (
                    <span
                      className={cn(
                        "absolute top-[52px] left-[calc(50%-245.5px)] h-[277px] w-[491.4px] overflow-hidden opacity-0",
                        MOVE,
                        // The video (1916x926 = 2.07:1) is flatter than the screen
                        // box (1.77:1), and the original's 4px black strip on the
                        // right was trimmed and 2x playback speed baked in (design
                        // QA). cover would crop 7.2% off each side and lose the
                        // left logo and the right '선정' button, so the width is
                        // filled, the video pinned to the top, and the space below
                        // painted in the video's bottom row color (#999) - that row
                        // is uniform horizontally, so no seam shows. Re-encoding at
                        // 491:277 would make this unnecessary.
                        "bg-[#999]",
                        // Scale origin: mockup center (50%, 30+222.5) against the
                        // overlay origin (50%-245.5, 52).
                        "introtab:origin-[245.5px_200.5px] introtab:scale-[0.681] introtab:group-hover:scale-100",
                        "max-introtab:top-[30px] max-introtab:left-[calc(50%-166px)] max-introtab:h-[188px] max-introtab:w-[333.5px] max-mo:left-[calc(50%-120px)]",
                        // Cover the mockup screen only once the video can play. TAB
                        // and MO have no hover, so it shows in the default state
                        // (design QA); autoplay + loop handle playback and
                        // stopVideo does not stop it by width.
                        readyVideos[index] &&
                          "max-introtab:opacity-100 introtab:group-hover:opacity-100",
                      )}
                    >
                      <video
                        className="block h-full w-full object-contain object-top"
                        ref={(element) => {
                          videoRefs.current[index] = element;
                        }}
                        src={card.hoverVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onCanPlay={() =>
                          setReadyVideos((prev) => ({ ...prev, [index]: true }))
                        }
                      />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
