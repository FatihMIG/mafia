import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GamePhase } from "@wolf/shared";
import { phaseSweepTimeline } from "../../animations/timelines";

interface Props {
  phase: GamePhase;
  children: (displayPhase: GamePhase) => ReactNode;
}

export function PhaseTransitionOverlay({ phase, children }: Props) {
  const [displayPhase, setDisplayPhase] = useState(phase);
  const overlayRef = useRef<HTMLDivElement>(null);
  const displayPhaseRef = useRef(phase);

  // Depends only on `phase` — displayPhase is set BY this effect (via the gsap
  // callback), so including it here would re-run the effect on its own state
  // change and kill the timeline mid-flight, leaving the overlay stuck opaque.
  useEffect(() => {
    if (phase === displayPhaseRef.current) return;
    const overlay = overlayRef.current;
    if (!overlay) {
      displayPhaseRef.current = phase;
      setDisplayPhase(phase);
      return;
    }
    const tl = phaseSweepTimeline(overlay, () => {
      displayPhaseRef.current = phase;
      setDisplayPhase(phase);
    });
    return () => {
      tl.kill();
    };
  }, [phase]);

  return (
    <div className="relative">
      {children(displayPhase)}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 rounded-lg bg-black opacity-0" />
    </div>
  );
}
