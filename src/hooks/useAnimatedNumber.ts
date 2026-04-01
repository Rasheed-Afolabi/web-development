import { useState, useEffect, useRef } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useAnimatedNumber(target: number, duration: number = 600): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const startValue = prevTarget.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = startValue + (target - startValue) * eased;

      setCurrent(value);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [target, duration]);

  return current;
}
