import { useEffect, useState } from "react";

/** Matches Ant Design lg breakpoint (≥992px = desktop sidebar) */
const LG_MIN = 992;

export function useIsNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < LG_MIN;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${LG_MIN - 1}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
}
