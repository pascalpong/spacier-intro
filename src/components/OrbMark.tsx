/* ============================================================
   SPACIER — orb mark (inline SVG)
   The standalone brand symbol: a dark iridescent sphere with a
   single specular highlight and a lime rim. Mirrors the SVG in
   the design bundle (brand/spacier-mark.svg). `uid` keeps the
   gradient ids unique when several marks share one document.
   ============================================================ */

export function OrbMark({ size = 96, uid }: { size?: number; uid: string }) {
  const orbId = `o-orb-${uid}`;
  const specId = `o-spec-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Spacier orb"
    >
      <defs>
        <radialGradient id={orbId} cx="40%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#eef6c8" />
          <stop offset="14%" stopColor="#9bb24a" />
          <stop offset="42%" stopColor="#2c3550" />
          <stop offset="78%" stopColor="#11131f" />
          <stop offset="100%" stopColor="#07080c" />
        </radialGradient>
        <radialGradient id={specId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="32" fill="none" stroke="#ccff00" strokeOpacity="0.18" strokeWidth="4" />
      <circle cx="40" cy="40" r="29" fill={`url(#${orbId})`} />
      <circle cx="40" cy="40" r="29" fill="none" stroke="#ccff00" strokeOpacity="0.85" strokeWidth="1.4" />
      <circle cx="33" cy="31" r="7.5" fill={`url(#${specId})`} />
    </svg>
  );
}
