# BITCOREOS-95 — Canonical Plan

Updated: 2026-08-21

## Canonical product loop

`find -> understand -> request -> execute -> observe -> review -> crystallize -> reuse`

BITCOREOS-95 is the interface across that loop. BIThub remains the live work plane and BITwiki remains the durable knowledge plane.

## First-class user surfaces

The primary product grammar is intentionally small:

- **Ask** — understand the ecosystem and evidence conversationally.
- **Research** — identify what knowledge work is actually needed and prepare/dispatch it.
- **Explore** — navigate live work, durable knowledge, curated BIThub spaces, agents, feeds, and semantic relations.

Contextual surfaces:

- **My BIThub** — personal contribution/state workspace after identity is attached; anonymous mode remains useful without login.
- **Knowledge Graph** — a secondary Explore mode for schema/relationship navigation, not a competing first-class app.
- **Lander** — sparse orientation only.

## Canonical architecture

### Read plane

- BIThub public reads: native Discourse APIs.
- BIThub category/space streams: native Discourse category JSON.
- BITwiki public reads: MediaWiki REST / Action API.
- Semantic navigation: per-subject Semantic MediaWiki relations first; broader directories/Concepts only where the live runtime actually supports them.
- Operational knowledge-request state: Cargo when live and healthy; source-controlled `wiki-content` remains the canonical fallback/source truth when runtime tables lag deployment.

### Identity plane

- Anonymous: explicit guest/public-read identity state.
- DiscourseConnect SSO: verified BIThub user identity.
- BITCOREOS signed session: local projection of verified identity.
- Delegated Discourse User API Key: user-scoped private API authority.
- Future BITwiki identity bridge: required before same-username MediaWiki `User:` namespace data is treated as verified ownership rather than a provisional projection.

### Execution plane

- n8n: privileged action broker and policy boundary.
- Agent execution: existing B8-compatible agent interfaces / registries.
- Canonical BITwiki content writes: source-controlled `wiki-content` workflow rather than unsynchronized live edits.

## Milestones

### M1 — Resource hydration + internal readers

Completed application layer:

- Full BIThub topic/post hydration.
- Full BITwiki page hydration.
- Internal Explore reader.
- Hydrated Ask evidence.
- Hydrated Research evidence.

### M2 — Identity + personal BIThub

Application layer substantially complete:

- Anonymous user state.
- Production DiscourseConnect configuration and login redirect.
- Signed BIThub identity session.
- Scoped Discourse User API Key authorization.
- Notifications.
- Bookmarks/tracked/watched topics.
- Public contribution trail and real contribution indicators.
- Provisional same-username BITwiki User: namespace/contribution projection.

Verification gates:

- Complete a real DiscourseConnect callback round trip.
- Complete a real User API Key approval round trip.
- Verify My BIThub with real private user state.

### M3 — Agent registry + capability projection

Completed application layer:

- Read the canonical BIThub agent registry used by `agent.b8-plugin`.
- Surface agents/constructs as navigable resources.
- Reuse the B8 capability vocabulary instead of inventing a parallel agent API.
- Distinguish public read tools from authenticated write/dispatch tools.
- Distinguish registry-only identities from real Discourse users.

### M4 — Canonical Research state

Application layer substantially complete:

- Research request taxonomy:
  - new page
  - revision
  - category/navigation
  - SMW semantic model
  - Lua/computed projection
  - reusable artifact
  - coverage audit
- Duplicate/existing-page/request preflight.
- Current target SMW fact inspection.
- Canonical knowledge lifecycle:
  `requested -> researching -> drafting -> review -> satisfied | declined`.
- Separate execution lifecycle:
  `queued -> dispatched -> running -> waiting -> failed -> completed`.
- Cargo-first request-state adapter with explicit `wiki-content` fallback.

Infrastructure gate:

- Repair/deploy live Cargo `Knowledge_requests` before Cargo can be trusted as runtime request-state authority.

### M5 — n8n action broker

Application contract complete:

- action
- actor
- target
- payload
- source context
- correlation ID
- idempotency key
- risk class
- requested timestamp
- HMAC request signing
- allowlisted actions

n8n owns secrets, sensitive writes, validation, jailbreak/prompt-injection-sensitive execution, retries, cross-system transactions, and verification.

Infrastructure gate:

- Connect the production n8n endpoint/secret and verify action reconciliation.

### M6 — Real Deploy Research

Next major functional milestone:

- Preflight internal corpus.
- Decide whether the needed output is a page, revision, category/navigation change, semantic model, Lua/computed projection, reusable artifact, or coverage request set.
- Create/update the authoritative Requested Knowledge record.
- Create or attach a BIThub research work trail.
- Dispatch appropriate B8-compatible agents/workflows through guarded execution.
- Observe execution state independently from knowledge state.
- Collect evidence/artifacts.
- Move through drafting/review.
- Produce a candidate source-controlled BITwiki change.
- Preserve provenance between request, BIThub work, agents, evidence, draft, schema/projection changes, and canonical page.

### M7 — Semantic ontology + provenance

- Continue replacing broad category topology with authoritative semantic relations.
- Use real per-subject SMW assertions in readers and graph traversal.
- Add cross-system relations such as:
  - discusses
  - defines
  - produces
  - references
  - derived-from
  - requested-by
  - executed-by
  - canonicalizes
  - revises
  - projects
- Make provenance navigable in both directions.

## Canonical navigation vocabulary

Explore should expose real BIThub system spaces without duplicating their state:

- Discussions → Community
- Nodes → Nodes
- Cores → Cores
- Markets → Marketplace
- Artifacts → Artifacts
- Workspaces → Workspaces
- Feeds → Feeds
- BITCOREOS → BITCOREOS

These are user-facing aliases/entry points over authoritative Discourse categories, not another taxonomy.

## Canonical personal-space model

My BIThub is allowed to be denser than the lander because its purpose is organization.

Canonical personal projections:

- contribution trail
- topics/replies
- real participation metrics
- saved/bookmarked topics
- tracked/watched topics
- notifications
- provisional BITwiki User: namespace/contributions
- future owned/requested research work once provenance is authoritative

Any gamified layer must represent real activity/state. Do not add arbitrary XP, levels, or scores merely for decoration.

## Canonical now

- Ask
- Research
- Explore
- My BIThub
- Search/feed/internal source readers
- curated native BIThub Spaces
- secondary Knowledge Graph
- DiscourseConnect identity
- delegated user authority
- B8 agent registry/capability family
- n8n privileged action broker
- Requested Knowledge lifecycle
- SMW subject relations
- Hub/Wiki/agent/research provenance direction

## Possibilities, not commitments

- vector/embedding search
- personalized recommendation feeds
- live agent presence visualization
- MessageBus-powered realtime UI
- collaborative notebooks
- automatic publish without review
- coverage heatmaps
- knowledge health dashboards
- PWA/offline mode
- public BITCOREOS MCP/API

Do not promote a possibility into the canonical plan until a concrete user need and an authoritative state owner are identified.
