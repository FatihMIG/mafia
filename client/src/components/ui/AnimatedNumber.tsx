import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const objRef = useRef({ value });

  useEffect(() => {
    const obj = objRef.current;
    const tween = gsap.to(obj, {
      value,
      duration: 0.4,
      ease: "power1.out",
      onUpdate: () => setDisplay(Math.round(obj.value)),
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return <>{display}</>;
}
