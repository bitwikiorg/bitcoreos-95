# BITCOREOS-95

A retro-desktop semantic navigator for the BIT ecosystem.

BITCOREOS-95 is a **clarity and access layer** over:

- **BIThub** (`hub.bitwiki.org`) — the workshop: discussion, agents, tools, workflows, artifacts, and collaboration.
- **BITwiki** (`bitwiki.org`) — the library: canonical, durable, structured knowledge and semantic relationships.

It does not replace Discourse, MediaWiki, Hivemind, or their data models. Those systems remain authoritative.

## Product rule

> Never require the user to understand BIThub's internal architecture before they can benefit from BIThub.

The app translates human intent into the correct Hub/Wiki resource, concept, or capability.

## Surfaces

- **Explorer** — intent-first navigation and federated discovery.
- **Ask** — bounded anonymous AI guide grounded only in public Hub/Wiki context.
- **Graph** — ontology/layer navigation across ENTRY → BIThub → BITwiki → ACCESS relationships.
- **Terminal** — power-user interface over the same resource/navigation model.

## Architecture

```text
User
  ↓
BITCOREOS-95
  ├─ Explorer
  ├─ Ask
  ├─ Graph
  └─ Terminal
       ↓
Unified resource / retrieval layer
  ├─ Discourse public API → BIThub
  └─ MediaWiki APIs        → BITwiki
```

The first implementation includes a read-only `/api/search?q=` adapter that normalizes public BIThub and BITwiki results. Authenticated writes and anonymous inference remain intentionally separate future layers.

## Development

```bash
npm install
npm run dev
```

Built on Next.js 16 / React 19 for Vercel.
