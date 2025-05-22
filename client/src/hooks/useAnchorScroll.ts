// src/hooks/useAnchorScroll.ts
import { useEffect } from "react";

export function useAnchorScroll(location: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = location.split("#")[1];

    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);
}
