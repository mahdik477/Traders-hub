"use client";

import { useLayoutEffect, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StaticHeroBackdrop from "./StaticHeroBackdrop";

const TerrainScene = dynamic(() => import("./TerrainScene"), { ssr: false });

type Mode = "simplified" | "reduced" | "full";

/**
 * The homepage hero's background and scroll choreography.
 *
 * Three render modes, decided once on mount, before the browser paints
 * (useLayoutEffect, not useEffect — this is what keeps the mode switch
 * from ever being a visible layout shift):
 *  - "reduced": prefers-reduced-motion. No pin, no scroll animation, no
 *    WebGL. A plain, short, static hero.
 *  - "simplified": a capable browser that still asked for less motion
 *    budget (small screen). Keeps the scroll-pinned text handoff (cheap,
 *    CSS/DOM only) but swaps the 3D terrain for a static image.
 *  - "full": everything, including the WebGL terrain scene.
 *
 * "simplified" and "full" share the exact same DOM height (a tall pinned
 * wrapper) so upgrading from one to the other never shifts anything below
 * it. Only "reduced" is a different (shorter) shape, and that's decided
 * before first paint.
 */
export default function CinematicHero({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef({ t: 0 });
  const [mode, setMode] = useState<Mode>("simplified");
  const [active, setActive] = useState(true);

  useLayoutEffect(() => {
    // Client-only capability check (matchMedia/innerWidth don't exist during
    // SSR) that has to land before paint, same unavoidable pattern as the
    // mount-detection effects elsewhere in the codebase — this is what keeps
    // the mode switch from ever being a visible layout shift.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("reduced");
      return;
    }
    const capable = window.innerWidth >= 768;
    setMode(capable ? "full" : "simplified");
  }, []);

  useEffect(() => {
    if (mode === "reduced" || !outerRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const proxy = { t: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });
      tl.to(
        proxy,
        {
          t: 1,
          duration: 1,
          ease: "none",
          onUpdate: () => {
            progressRef.current.t = proxy.t;
          },
        },
        0,
      );
      if (textRef.current) {
        tl.to(textRef.current, { opacity: 0, yPercent: -12, filter: "blur(6px)", duration: 0.4, ease: "power1.in" }, 0.05);
      }
    }, outerRef);
    return () => ctx.revert();
  }, [mode]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pinned = mode !== "reduced";

  return (
    <div ref={outerRef} className="hero-force-dark relative" style={pinned ? { height: "170vh" } : undefined}>
      <div
        className={
          pinned
            ? "sticky top-0 h-screen w-full overflow-hidden"
            : "relative min-h-[88vh] w-full overflow-hidden sm:min-h-screen"
        }
      >
        <div className="absolute inset-0 -z-20">
          {mode === "full" ? <TerrainScene progressRef={progressRef} active={active} /> : <StaticHeroBackdrop />}
        </div>
        <div aria-hidden="true" className="hero-grain pointer-events-none absolute inset-0 -z-10" />
        {/* Content is anchored near the top, not vertically centered. At rest
            (scroll position 0) this box sits in its natural, not-yet-stuck
            position just below the header and ticker strip — a centered
            h-screen box would overflow the viewport by exactly that offset
            before the user scrolls a single pixel. Anchoring near the top
            keeps everything inside the visible area regardless. overflow-y
            is a last-resort safety net, not the primary fix. */}
        <div
          ref={textRef}
          className="relative z-10 flex h-full items-start overflow-y-auto pt-[clamp(1.5rem,5vh,3rem)] pb-4"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
