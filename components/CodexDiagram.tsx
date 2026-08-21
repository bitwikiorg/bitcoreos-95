export function CodexDiagram() {
  return (
    <svg className="codex-diagram" viewBox="0 0 520 360" role="img" aria-label="Abstract ophanimic intelligence seal">
      <defs>
        <linearGradient id="ophanim-spectrum-large" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7625ff" />
          <stop offset=".24" stopColor="#126cff" />
          <stop offset=".48" stopColor="#00d8d0" />
          <stop offset=".66" stopColor="#00df9d" />
          <stop offset=".82" stopColor="#eaff3e" />
          <stop offset="1" stopColor="#ff348e" />
        </linearGradient>
        <radialGradient id="ophanim-pupil" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".26" stopColor="#151515" />
          <stop offset=".48" stopColor="#151515" />
          <stop offset=".5" stopColor="#00d8d0" />
          <stop offset=".72" stopColor="#7625ff" />
          <stop offset="1" stopColor="#151515" />
        </radialGradient>
      </defs>

      <g className="codex-construction" fill="none" stroke="currentColor">
        <circle cx="260" cy="180" r="139" opacity=".13" strokeDasharray="2 8" />
        <circle cx="260" cy="180" r="111" opacity=".16" />
        <path d="M260 34v292M114 180h292" opacity=".09" />
        <path d="M157 77L363 283M363 77L157 283" opacity=".07" />
        <path d="M260 45l39 96 101-1-79 63 31 96-92-53-92 53 31-96-79-63 101 1z" opacity=".11" />
      </g>

      <g className="codex-orbits" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="260" cy="180" rx="178" ry="61" />
        <ellipse cx="260" cy="180" rx="178" ry="61" transform="rotate(58 260 180)" />
        <ellipse cx="260" cy="180" rx="178" ry="61" transform="rotate(118 260 180)" />
        <ellipse cx="260" cy="180" rx="135" ry="98" transform="rotate(25 260 180)" opacity=".68" />
        <ellipse cx="260" cy="180" rx="135" ry="98" transform="rotate(-25 260 180)" opacity=".68" />
      </g>

      <g className="codex-eye" fill="none" stroke="currentColor">
        <path d="M176 180c29-42 58-62 84-62s55 20 84 62c-29 42-58 62-84 62s-55-20-84-62z" strokeWidth="2.4" />
        <ellipse cx="260" cy="180" rx="43" ry="61" strokeWidth="1.8" />
        <ellipse cx="260" cy="180" rx="23" ry="42" strokeWidth="1.4" opacity=".72" />
        <circle cx="260" cy="180" r="12" fill="url(#ophanim-pupil)" stroke="none" />
        <circle cx="260" cy="180" r="4" fill="#111" stroke="none" />
      </g>

      <path d="M92 167c86-37 148-38 204-13 52 23 88 22 132-7" fill="none" stroke="url(#ophanim-spectrum-large)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M138 77c43 79 72 121 126 142 48 18 89 14 128-16" fill="none" stroke="url(#ophanim-spectrum-large)" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />

      <g fill="currentColor">
        <circle cx="82" cy="180" r="3" />
        <circle cx="438" cy="180" r="3" />
        <circle cx="171" cy="26" r="3" />
        <circle cx="349" cy="334" r="3" />
        <circle cx="349" cy="26" r="3" />
        <circle cx="171" cy="334" r="3" />
      </g>
      <g fill="none" stroke="url(#ophanim-spectrum-large)" strokeWidth="1.4">
        <circle cx="82" cy="180" r="8" />
        <circle cx="438" cy="180" r="8" />
        <circle cx="171" cy="26" r="7" />
        <circle cx="349" cy="334" r="7" />
      </g>
    </svg>
  );
}
