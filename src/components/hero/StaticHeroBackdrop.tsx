// What renders instead of the WebGL terrain for `prefers-reduced-motion`,
// small screens, or while the real scene is still loading — a still image
// in the same visual language (layered gold horizon silhouettes dissolving
// into the dark) rather than a blank panel or a spinner. Pure CSS/SVG, no
// WebGL, so this is genuinely cheap: nothing here depends on Three.js ever
// being fetched.
export default function StaticHeroBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-background">
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="ridge-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a6a1f" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#070708" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ridge-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8c56a" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#070708" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ridge-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5d76e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#070708" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 420 L120 390 L260 430 L400 360 L560 410 L700 340 L860 400 L1000 350 L1200 400 L1200 700 L0 700 Z"
          fill="url(#ridge-far)"
        />
        <path
          d="M0 480 L150 460 L300 500 L460 430 L620 470 L780 410 L940 460 L1100 420 L1200 450 L1200 700 L0 700 Z"
          fill="url(#ridge-mid)"
        />
        <path
          d="M0 540 L180 525 L340 555 L520 505 L680 540 L860 495 L1020 530 L1200 505 L1200 700 L0 700 Z"
          fill="url(#ridge-near)"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
}
