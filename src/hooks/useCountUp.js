import { useEffect, useRef, useState } from "react";

// Menganimasikan angka dari 0 ke `value` selama `duration` ms, pakai
// requestAnimationFrame (bukan setInterval) supaya mulus & efisien.
export function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic - cepat di awal, melambat di akhir (terasa lebih natural).
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}
