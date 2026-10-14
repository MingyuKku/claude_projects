// Class bundles shared by several landing components. Tailwind has no scoping,
// so repeated utility strings live here.

/**
 * Centers content at 1200px on PC; TAB and MO only get horizontal padding.
 * The 1240px max-width is the 1200px content plus 20px padding on each side
 * (preflight's border-box keeps the padding from shrinking the content).
 */
export const CONTAINER =
  "mx-auto w-full max-w-[1240px] px-5 max-introtab:px-10 max-mo:px-5";

/**
 * Scroll-reveal styling; pair it with a `data-reveal` attribute so `createReveal`
 * can find the element and add `data-revealed`.
 *
 * Tailwind v4's translate-y-* uses the CSS `translate` property, not `transform`,
 * so the transition must target `translate` or the position snaps.
 * 1.1s / 32px is a design request ("slower"); lengthening only the time made it
 * look frozen rather than slow, so the travel distance grew with it.
 */
export const REVEAL =
  "translate-y-8 opacity-0 transition-[opacity,translate] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] data-[revealed]:translate-y-0 data-[revealed]:opacity-100";
