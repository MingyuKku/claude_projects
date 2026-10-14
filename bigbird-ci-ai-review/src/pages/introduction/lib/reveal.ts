// Scroll-driven reveal: content floats up as it enters the viewport.
//
// Targets are marked with `data-reveal` rather than a class list so that renaming
// inner classes never needs a matching edit here. The hero is deliberately not
// marked: it is already on screen at load, and animating it would look like a
// slow load.

// Siblings under one parent appear slightly later each, so cards in a row rise
// one by one. Capped at the fourth: with 8 cards in one group the last one would
// otherwise appear long after the rest and feel stuck.
const STAGGER_MS = 120;
const STAGGER_MAX = 3;

// Trigger when the element is this far up from the bottom of the viewport.
// At 1.0 it would start the moment it touches the edge and be fully risen
// before the eye lands on it.
const TRIGGER_RATIO = 0.88;

const REVEAL_SELECTOR = "[data-reveal]";
const REVEALED_ATTRIBUTE = "data-revealed";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface Reveal {
  check(): void;
}

const NOOP: Reveal = { check() {} };

function staggerDelay(
  element: Element,
  seen: Map<ParentNode | null, number>,
): number {
  const parent = element.parentNode;
  const order = seen.get(parent) ?? 0;
  seen.set(parent, order + 1);
  return Math.min(order, STAGGER_MAX) * STAGGER_MS;
}

/**
 * Registers the reveal targets and returns a `check()` to call on every scroll.
 *
 * It measures positions instead of using IntersectionObserver: a big jump
 * (anchor link, reload, a wheel flick across screens) can skip an element past
 * the intersection threshold without ever firing the callback, leaving that block
 * hidden for good. Measuring has no such hole - blocks already passed still show.
 *
 * @param root the scroll container
 */
export function createReveal(root: HTMLElement | null): Reveal {
  if (!root) return NOOP;

  let pending = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
  if (!pending.length) return NOOP;

  // Reduced-motion users see everything at once; CSS treats `data-revealed` as
  // the visible state.
  if (window.matchMedia?.(REDUCED_MOTION_QUERY).matches) {
    pending.forEach((element) => element.setAttribute(REVEALED_ATTRIBUTE, ""));
    return NOOP;
  }

  const seen = new Map<ParentNode | null, number>();
  pending.forEach((element) => {
    const delay = staggerDelay(element, seen);
    if (delay) element.style.transitionDelay = `${delay}ms`;
  });

  return {
    check() {
      if (!pending.length) return;
      const line =
        root.getBoundingClientRect().top + root.clientHeight * TRIGGER_RATIO;
      pending = pending.filter((element) => {
        if (element.getBoundingClientRect().top >= line) return true;
        // Once revealed it never goes back.
        element.setAttribute(REVEALED_ATTRIBUTE, "");
        return false;
      });
    },
  };
}
