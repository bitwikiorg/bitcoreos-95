export function CodexDiagram() {
  return (
    <svg className="codex-diagram" viewBox="0 0 560 380" role="img" aria-label="Abstract ophanimic intelligence seal">
      <defs>
        <linearGradient id="seal-spectrum" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7825ff" />
          <stop offset=".22" stopColor="#126cff" />
          <stop offset=".48" stopColor="#00d8d0" />
          <stop offset=".67" stopColor="#00df9d" />
          <stop offset=".82" stopColor="#ecff3f" />
          <stop offset="1" stopColor="#ff338c" />
        </linearGradient>
        <radialGradient id="seal-core" cx="50%" cy="48%" r="54%">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset=".44" stopColor="#fffdf6" />
          <stop offset=".46" stopColor="#181817" />
          <stop offset=".63" stopColor="#181817" />
          <stop offset=".65" stopColor="#00d8d0" />
          <stop offset=".79" stopColor="#7825ff" />
          <stop offset="1" stopColor="#171716" />
        </radialGradient>
      </defs>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="280" cy="190" r="150" opacity=".13" strokeWidth="1" strokeDasharray="2 9" />
        <circle cx="280" cy="190" r="116" opacity=".16" strokeWidth="1" />
        <path d="M280 47l42 103 108 2-84 68 31 104-97-58-97 58 31-104-84-68 108-2z" opacity=".08" strokeWidth="1" />

        <path d="M88 185C118 112 199 94 279 136c80 42 143 27 193-24 27 78-27 143-109 154-84 11-142-54-213-42-34 6-60-7-62-39z" strokeWidth="2.2" />
        <path d="M117 87c64 16 99 64 116 119 18 58 63 89 129 86 58-3 97-34 113-74-73 17-129-3-169-59-38-53-94-81-189-72z" strokeWidth="1.7" opacity=".78" />
        <path d="M183 48c-10 82 25 135 88 163 67 30 94 72 76 127 69-36 87-103 46-165-40-60-111-81-210-125z" strokeWidth="1.6" opacity=".72" />
        <path d="M384 52c12 76-17 128-75 158-62 31-88 76-73 126-66-33-86-95-53-153 35-61 102-91 201-131z" strokeWidth="1.6" opacity=".72" />
      </g>

      <g fill="none" stroke="url(#seal-spectrum)" strokeLinecap="round">
        <path d="M98 211c70-44 134-54 193-19 62 36 118 39 176 3" strokeWidth="6" />
        <path d="M149 72c69 52 109 96 130 144 20 47 62 78 127 92" strokeWidth="2.2" opacity=".9" />
      </g>

      <g className="seal-eye" fill="#fffdf6" stroke="currentColor" strokeLinejoin="round">
        <path d="M198 190c25-43 54-64 82-64s57 21 82 64c-25 43-54 64-82 64s-57-21-82-64z" strokeWidth="2.5" />
        <ellipse cx="280" cy="190" rx="39" ry="58" fill="none" strokeWidth="1.7" />
        <ellipse cx="280" cy="190" rx="20" ry="38" fill="none" strokeWidth="1.2" opacity=".6" />
        <ellipse cx="280" cy="190" rx="10" ry="22" fill="url(#seal-core)" stroke="none" />
        <ellipse cx="280" cy="190" rx="4" ry="14" fill="#171716" stroke="none" />
      </g>

      <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".9">
        <circle cx="97" cy="183" r="6" /><circle cx="468" cy="116" r="6" />
        <circle cx="177" cy="55" r="5" /><circle cx="380" cy="321" r="5" />
        <circle cx="116" cy="257" r="4" /><circle cx="451" cy="257" r="4" />
      </g>
      <g fill="url(#seal-spectrum)">
        <circle cx="97" cy="183" r="2.3" /><circle cx="468" cy="116" r="2.3" />
        <circle cx="177" cy="55" r="2" /><circle cx="380" cy="321" r="2" />
        <circle cx="116" cy="257" r="1.8" /><circle cx="451" cy="257" r="1.8" />
      </g>
    </svg>
  );
}
