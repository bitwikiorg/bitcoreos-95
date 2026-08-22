# BITCOREOS-95 — Current State

Updated: 2026-08-21
Status: active functional build
Branch policy: active development occurs on `main`; archival branches are rollback snapshots only.

## Product role

BITCOREOS-95 is the low-friction navigation, research, and interaction client across BIThub and BITwiki.

It is not a new authority for Hub or Wiki data.

- BIThub / Discourse owns live work, discussion, users, messages, agent-facing work trails, categories, and interaction state.
- BITwiki / MediaWiki owns durable knowledge. Semantic MediaWiki owns semantic assertions; Cargo owns bounded operational records when deployed; the `wiki-content` repository owns source-controlled canonical wiki content.
- n8n is the privileged action and policy boundary for sensitive writes, multi-system transactions, guarded execution, retries, secrets, and jailbreak/prompt-injection-sensitive workflows.
- `bitwikiorg/agent.b8-plugin` is the canonical agent-facing BIThub capability family.
- BITCOREOS-95 owns retrieval, normalization, navigation, user-facing projections, session state, research UX, provenance display, and action routing.

## Authority model

### Public reads
Direct native APIs where possible:

- Discourse public APIs for BIThub.
- MediaWiki REST / Action API, then SMW/Cargo query surfaces where appropriate, for BITwiki.

Do not route harmless public reads through n8n merely for uniformity.

### Identity
DiscourseConnect SSO answers: **who is the user?**

BITCOREOS-95 maintains a signed local session projection of the verified BIThub identity; Discourse remains the identity authority.

### Delegated BIThub authority
A Discourse User API Key answers: **what may BITCOREOS-95 read or do as this user?**

Identity and delegated API authority remain separate concerns.

### Mutations / privileged execution
Sensitive writes and multi-system actions route through n8n by default.

Canonical action flow:

`guard -> execute -> verify`

Actions carry correlation and idempotency identifiers so UI, n8n, BIThub, agents, and BITwiki work can be reconciled without duplicate execution.

## Primary product surfaces

Primary work surfaces:

- Ask
- Research
- Explore

Secondary/contextual surfaces:

- My BIThub personal workspace
- Knowledge Graph inside Explore
- Kordylewski Relay guide

The sparse lander remains an orientation surface rather than a dashboard.

## Current implemented functionality

### Public navigation and retrieval

- Federated BIThub + BITwiki search.
- Hydrated internal source readers for BIThub topics and BITwiki pages.
- Ask grounded in bounded hydrated Hub/Wiki source content.
- Explore feed, search, agents, and curated BIThub Spaces.
- Native Discourse category streams for Discussions/Community, Nodes, Cores, Markets/Marketplace, Artifacts, Workspaces, Feeds, and BITCOREOS.
- Public B8 agent registry projection using the canonical BIThub registry topic.
- Common source normalization, including encoded punctuation cleanup.

### BITwiki semantic/research reads

- MediaWiki page hydration with rendered-page fallback.
- SMW runtime diagnostics and per-subject semantic fact traversal.
- Knowledge Graph layer map plus optional real SMW subject relations.
- Research intent taxonomy: new page, revision, category/navigation, semantic model, Lua/computed projection, reusable artifact, coverage audit.
- Existing-page/request preflight.
- Current target SMW facts can be included in research preflight.
- Requested Knowledge reads prefer live Cargo but fall back to canonical `wiki-content` when live Cargo is unavailable.

Current live limitation: Cargo `Knowledge_requests` throws a MediaWiki runtime exception, so Research currently reports and uses the source-controlled fallback rather than pretending Cargo is healthy.

### Identity and personal workspace

Production auth currently reports `configured: true` using `DISCOURSE_SSO_SECRET`.

Verified production behavior:

- anonymous `/api/auth/me` returns `user: null, configured: true`;
- `/api/auth/login` issues a real redirect to BIThub `/session/sso_provider`;
- production return URL is `https://bitcoreos-95.vercel.app/api/auth/callback`;
- anonymous UI explicitly presents the user as Anonymous / public read mode;
- shell and personal workspace expose Sign in with BIThub actions.

The full callback cannot be verified without completing a real BIThub browser login; that remains the next identity verification step.

My BIThub currently supports:

- anonymous guest projection;
- public contribution trail for a signed-in BIThub identity;
- contribution metrics and contribution-mix visualization based on real retrieved data;
- provisional same-username BITwiki User: namespace and contribution projection;
- scoped Discourse User API Key handshake using RSA/OAEP;
- encrypted HttpOnly delegated credential storage;
- notifications;
- bookmarks, tracked topics, and watched topics projected into Saved + inbox;
- disconnect/revoke path.

The delegated User API approval/callback still needs a real signed-in user round-trip verification.

### Agent/action boundary

- Public B8 registry reader parses the live registry and canonical capability vocabulary.
- Registry identities that are not real Discourse users are not linked as fake user profiles.
- Typed guarded BITCOREOS -> n8n action envelope exists with HMAC signing, correlation ID, idempotency key, risk class, source context, and allowlisted action vocabulary.

The n8n broker is code-complete but not live until its production endpoint/secret are configured.

## Live observed system state

BIThub public API currently exposes real category/topic streams, including Nodes and Cores.

BITwiki SMW runtime currently reports substantial semantic usage but an underdeclared schema surface: thousands of property values/uses, hundreds of semantic queries, few declared Property pages, and no live Concepts returned by the current directory browse. Per-subject SMW relations do work and should be treated as the reliable semantic navigation primitive for now.

## Current external/infrastructure dependencies

- Complete one real DiscourseConnect login/callback round trip.
- Complete one real Discourse User API Key approval/callback round trip.
- Configure `N8N_ACTION_URL` and `N8N_ACTION_SECRET` before guarded actions can execute.
- Repair/deploy live Cargo `Knowledge_requests` if Cargo is to become runtime request-state authority.
- Decide and configure the future BIThub ↔ BITwiki verified identity bridge before treating same-username MediaWiki User: data as authenticated ownership.

## UI invariants

- Win95/BITCOREOS-95 styling exists to reduce cognitive load, not simulate an operating system for its own sake.
- Ask, Research, and Explore are first-class.
- The front page stays a sparse lander.
- Complex dashboards belong only where they serve a task, especially My BIThub.
- Progressive disclosure is preferred over always-visible panes.
- Knowledge Graph is secondary navigation, not a first-class homepage function.
- No command palette.
- No fake minimize/maximize/close controls.
- No decorative controls without behavior.
- No developer/configuration metalanguage on public user surfaces.
- The ophanim / engineering-codex motif is a restrained recurring interface mark, not content lore.
