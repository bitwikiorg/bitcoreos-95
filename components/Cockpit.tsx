'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodexDiagram } from './CodexDiagram';

export function Cockpit() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) sessionStorage.setItem('bitcoreos-search-seed', value);
    router.push('/explorer');
  }

  return (
    <div className="home-simple">
      <section className="home-hero">
        <div className="home-copy">
          <div className="section-kicker">BITWIKI ECOSYSTEM ACCESS LAYER</div>
          <h1>Find the right knowledge, discussion, tool, or workflow.</h1>
          <p>Search BIThub + BITwiki, ask the system, or deploy research.</p>

          <form className="home-search sunken" onSubmit={search}>
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search BIThub + BITwiki"
              aria-label="Search BIThub and BITwiki"
            />
            <button type="submit">Go</button>
          </form>
        </div>

        <div className="home-mark" aria-hidden="true">
          <CodexDiagram />
        </div>
      </section>

      <section className="home-actions" aria-label="Primary actions">
        <button onClick={() => router.push('/explorer')}>
          <b>Find something</b><span>Search Hub + Wiki</span>
        </button>
        <button onClick={() => router.push('/ask')}>
          <b>Ask</b><span>Grounded research chat</span>
        </button>
        <button onClick={() => router.push('/research')}>
          <b>Research</b><span>Investigate deeply</span>
        </button>
      </section>

      <section className="home-systems" aria-label="Source systems">
        <a href="https://hub.bitwiki.org" target="_blank" rel="noreferrer">
          <b>BIThub ↗</b><span>work · discussion</span>
        </a>
        <a href="https://bitwiki.org" target="_blank" rel="noreferrer">
          <b>BITwiki ↗</b><span>knowledge · semantic memory</span>
        </a>
      </section>
    </div>
  );
}
