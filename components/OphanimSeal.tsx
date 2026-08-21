'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OphanimSeal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="ophanim-dock">
      {open && (
        <div className="ophanim-popover win-panel raised">
          <div className="mini-title">GUIDE // KORDYLEWSKI RELAY</div>
          <strong>What are you trying to find or produce?</strong>
          <p>I can route you through BIThub, BITwiki, a grounded chat, or a research request.</p>
          <div className="ophanim-actions">
            <button onClick={() => router.push('/ask')}>Ask</button>
            <button onClick={() => router.push('/research')}>Research</button>
            <button onClick={() => router.push('/explorer')}>Explore</button>
          </div>
        </div>
      )}
      <button className="ophanim-button" onClick={() => setOpen((value) => !value)} aria-label="Open BITCOREOS guide">
        <svg viewBox="0 0 96 96" role="img" aria-label="Ophanim guild seal">
          <defs>
            <linearGradient id="ophanim-spectrum" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8a2cff" />
              <stop offset=".26" stopColor="#276cff" />
              <stop offset=".5" stopColor="#00e7d4" />
              <stop offset=".72" stopColor="#eaff3c" />
              <stop offset="1" stopColor="#ff2d91" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#ophanim-spectrum)" strokeWidth="2.6">
            <ellipse cx="48" cy="48" rx="37" ry="15" />
            <ellipse cx="48" cy="48" rx="37" ry="15" transform="rotate(60 48 48)" />
            <ellipse cx="48" cy="48" rx="37" ry="15" transform="rotate(120 48 48)" />
            <circle cx="48" cy="48" r="20" />
            <circle cx="48" cy="48" r="9" />
          </g>
          <circle cx="48" cy="48" r="3.5" fill="#111" />
          <g fill="#111">
            <circle cx="11" cy="48" r="2" /><circle cx="85" cy="48" r="2" />
            <circle cx="29" cy="16" r="2" /><circle cx="67" cy="80" r="2" />
            <circle cx="67" cy="16" r="2" /><circle cx="29" cy="80" r="2" />
          </g>
        </svg>
      </button>
    </div>
  );
}
