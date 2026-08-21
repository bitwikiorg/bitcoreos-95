export function CodexDiagram() {
  return (
    <svg className="codex-diagram" viewBox="0 0 620 360" role="img" aria-label="BIThub to BITwiki intelligence circuit">
      <defs>
        <linearGradient id="codex-spectrum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a20ff" />
          <stop offset=".35" stopColor="#008cff" />
          <stop offset=".62" stopColor="#00e5b8" />
          <stop offset=".82" stopColor="#f2ff3f" />
          <stop offset="1" stopColor="#ff348d" />
        </linearGradient>
        <pattern id="codex-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="currentColor" opacity=".09" />
        </pattern>
      </defs>
      <rect x="4" y="4" width="612" height="352" fill="url(#codex-grid)" stroke="currentColor" opacity=".75" />
      <g fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M72 94l88-46 88 46v104l-88 46-88-46z" />
        <path d="M72 94l88 45 88-45M160 139v105" />
        <path d="M96 110l64 32 64-32v71l-64 34-64-34z" opacity=".6" />
        <circle cx="160" cy="160" r="34" />
        <circle cx="160" cy="160" r="8" />
        <path d="M382 74c70-20 118-1 145 42-18 19-24 43-17 72-45 39-96 44-151 13-16-47-8-90 23-127z" />
        <path d="M402 98c47-15 81-2 101 28-14 23-16 43-8 62-34 24-70 25-107 5-11-34-7-66 14-95z" opacity=".75" />
        <path d="M452 77v142M381 149h143M402 98l101 90M503 98l-101 90" opacity=".45" />
        <circle cx="452" cy="149" r="31" />
        <circle cx="452" cy="149" r="7" />
        <path d="M105 297h399" strokeDasharray="3 8" opacity=".55" />
        <circle cx="105" cy="297" r="4" fill="currentColor" />
        <circle cx="504" cy="297" r="4" fill="currentColor" />
      </g>
      <path d="M224 158C286 95 327 232 391 160" fill="none" stroke="url(#codex-spectrum)" strokeWidth="7" />
      <path d="M224 175C290 235 327 80 391 145" fill="none" stroke="url(#codex-spectrum)" strokeWidth="2" opacity=".9" />
      <g className="codex-labels">
        <text x="112" y="278">BITHUB // WORKCELL</text>
        <text x="398" y="278">BITWIKI // MEMORY</text>
        <text x="256" y="326">live work → validated knowledge → reuse</text>
      </g>
    </svg>
  );
}
