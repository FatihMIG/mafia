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

// Full-screen death effect: a quick red flash plus pixel-square "blood" particles
// bursting outward from the victim's avatar and falling under a gravity bias.
// `flash` and `particles` are plain DOM nodes the caller creates and removes —
// this stays a pure animation function so it composes with the headless,
// non-React-rendered overlay pattern the caller uses.
export function bloodSplatterTimeline(flash: HTMLElement, particles: HTMLElement[]): gsap.core.Timeline {
  const tl = gsap.timeline();

  tl.fromTo(flash, { opacity: 0 }, { opacity: 0.35, duration: 0.08, ease: "power1.in" }).to(flash, {
    opacity: 0,
    duration: 0.5,
    ease: "power1.out",
  });

  particles.forEach((particle, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 320;
    tl.to(
      particle,
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance + 60 + Math.random() * 140,
        rotation: (Math.random() - 0.5) * 540,
        scale: 0.4 + Math.random() * 0.5,
        opacity: 0,
        duration: 0.7 + Math.random() * 0.5,
        ease: "power2.out",
      },
      0.05 + i * 0.004,
    );
  });

  return tl;
}
