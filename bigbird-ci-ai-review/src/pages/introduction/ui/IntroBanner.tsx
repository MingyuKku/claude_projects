import { cn } from "@/shared/lib";

import { banner, type IntroButton } from "../model/data";

const VARIANT = {
  secondary: "bg-white text-[#222] backdrop-blur-[2px]",
  primary: "bg-[#4b80c2] text-white",
  ghost: "",
} as const;

interface Props {
  className?: string;
}

export function IntroBanner({ className }: Props) {
  return (
    // The background image comes from the data file with blend and rotation
    // already baked in; #343a40 only fills the margin outside the image.
    //
    // PC/TAB are not vertically centered: the design's absolute y is carried over
    // (title y=130, button y=273, so 57px apart). MO is centered vertically:
    // (433 - 128 - 32 - 112) / 2 = 80.5, which matches the design's title y.
    <section
      className={cn(
        "flex h-[433px] flex-col items-center gap-[57px] bg-[#343a40] bg-cover bg-center px-10 pt-[130px] max-mo:justify-center max-mo:gap-8 max-mo:px-5 max-mo:pt-0",
        className,
      )}
      style={{ backgroundImage: `url(${banner.bg})` }}
    >
      {/* w-[580px] is the design's title width. */}
      <div className="flex w-[580px] flex-col items-center gap-4 text-center max-mo:w-full">
        <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep text-white max-mo:text-2xl">
          {banner.title}
        </h2>
        <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#adb5bd] max-mo:text-base">
          {banner.description}
        </p>
      </div>

      {/* On MO the buttons stack and each fills the width. */}
      <div className="flex gap-4 max-mo:w-full max-mo:flex-col">
        {banner.buttons.map((button: IntroButton) => (
          <a
            key={button.label}
            className={cn(
              "flex h-12 min-w-[78px] items-center justify-center gap-2 rounded-[4px] px-6 text-base leading-6 font-medium whitespace-nowrap no-underline",
              VARIANT[button.variant],
            )}
            href={button.href}
            download={button.download}
          >
            {button.label}
            {button.icon && (
              // Same slot/graphic split as the hero button: a 16x16 slot with the
              // 5.99x10.665 arrow inside, because the svg stretches without it.
              <span className="flex size-4 flex-none items-center justify-center">
                <img
                  className="block h-[10.665px] w-[5.99px]"
                  src={button.icon}
                  alt=""
                  loading="lazy"
                />
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
