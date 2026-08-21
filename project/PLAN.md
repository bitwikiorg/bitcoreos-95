# BITCOREOS-95 — Canonical Plan

Updated: 2026-08-21

## Canonical product loop

`find -> understand -> request -> execute -> observe -> review -> crystallize -> reuse`

BITCOREOS-95 is the interface across that loop. BIThub remains the live work plane and BITwiki remains the durable knowledge plane.

## Canonical architecture

### Read plane

- BIThub public reads: Discourse APIs.
- BITwiki public reads: MediaWiki REST / Action API.
- Semantic navigation: Semantic MediaWiki queries and Concepts when the live runtime supports the required query surface.
- Operational knowledge state: Cargo, especially `Knowledge_requests`.

### Identity plane

- DiscourseConnect SSO: user identity.
- BITCOREOS signed session: local projection of verified identity.
- Delegated Discourse User API Key: user-scoped API authority.

### Execution plane

- n8n: privileged action broker and policy boundary.
- Agent execution: existing B8-compatible agent interfaces / registries.
- Canonical BITwiki content writes: source-controlled `wiki-content` workflow rather than unsynchronized live edits.

## Milestones

### M1 — Resource hydration + internal readers

- Full BIThub topic/post hydration.
- Full BITwiki page hydration.
- Internal Explorer reader.
- Hydrated Ask evidence.
- Hydrated Research evidence.

### M2 — Identity + delegated personal BIThub

- Configure production DiscourseConnect.
- Complete identity/session UX.
- Implement scoped Discourse User API Key authorization.
- Add user-scoped reads: notifications, bookmarks, tracked/watched topics, private resources only when delegated scope permits.

### M3 — Agent registry + capability projection

- Read the canonical BIThub agent registry used by `agent.b8-plugin`.
- Surface agents/constructs as navigable resources.
- Reuse the B8 capability vocabulary instead of inventing a parallel agent API.
- Distinguish public read tools from authenticated write/dispatch tools.

### M4 — Canonical Research state

- Query Cargo `Knowledge_requests` directly.
- Replace prototype research lifecycle state with the canonical knowledge lifecycle:
  `requested -> researching -> drafting -> review -> satisfied | declined`.
- Keep execution state separate:
  `queued -> dispatched -> running -> waiting -> failed -> completed`.
- Add duplicate/existing-page/request preflight.

### M5 — n8n action broker

Define one guarded BITCOREOS -> n8n action contract with:

- action
- actor
- target
- payload
- source context
- correlation ID
- idempotency key
- risk class
- requested timestamp

n8n owns secrets, sensitive writes, validation, retries, cross-system execution, and verification.

### M6 — Real Deploy Research

- Preflight internal corpus.
- Create/update knowledge request.
- Create BIThub research work trail when needed.
- Dispatch appropriate agents/workflows.
- Observe execution state.
- Collect evidence/artifacts.
- Move through drafting/review.
- Produce a candidate source-controlled BITwiki change.
- Preserve provenance between request, BIThub work, agents, evidence, draft, and canonical page.

### M7 — Semantic ontology + provenance

- Drive Ontology from actual SMW properties/Concepts plus bounded Cargo operational relations.
- Add cross-system relations such as:
  - discusses
  - defines
  - produces
  - references
  - derived-from
  - requested-by
  - executed-by
  - canonicalizes
- Make provenance navigable in both directions.

## Canonical now

- Search
- Explorer
- Ask
- Research
- Ontology
- DiscourseConnect identity
- delegated user authority
- B8 agent registry/capability family
- n8n privileged action broker
- Cargo Requested Knowledge lifecycle
- Hub/Wiki/agent/research provenance

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
