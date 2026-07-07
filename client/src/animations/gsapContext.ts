import { useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import gsap from "gsap";

/**
 * Runs `build` inside a gsap.context() scoped to the returned ref, so every
 * tween/timeline created inside it is automatically reverted on unmount or
 * when `deps` change — no manual tween bookkeeping in components.
 */
export function useGsapContext<T extends HTMLElement>(
  build: (scope: T) => void,
  deps: DependencyList,
): RefObject<T> {
  const scopeRef = useRef<T>(null);

  useLayoutEffect(() => {
    if (!scopeRef.current) return;
    const scope = scopeRef.current;
    const ctx = gsap.context(() => build(scope), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}
