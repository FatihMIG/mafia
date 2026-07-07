import gsap from "gsap";

export function flipRevealTimeline(card: HTMLElement): gsap.core.Timeline {
  return gsap
    .timeline()
    .set(card, { rotateY: 90, opacity: 0 })
    .to(card, { rotateY: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" });
}

export function phaseSweepTimeline(overlay: HTMLElement, onCovered: () => void): gsap.core.Timeline {
  return gsap
    .timeline()
    .set(overlay, { opacity: 0, pointerEvents: "auto" })
    .to(overlay, { opacity: 1, duration: 0.25, ease: "power1.in" })
    .call(onCovered)
    .to(overlay, { opacity: 0, duration: 0.35, ease: "power1.out", delay: 0.05 })
    .set(overlay, { pointerEvents: "none" });
}

export function eliminationHighlightTimeline(el: HTMLElement): gsap.core.Timeline {
  return gsap
    .timeline()
    .to(el, { scale: 1.15, filter: "brightness(1.6)", duration: 0.2, ease: "power2.out" })
    .to(el, { scale: 1, filter: "brightness(1)", duration: 0.5, ease: "power2.in" });
}
