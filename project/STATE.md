# BITCOREOS-95 — Current State

Updated: 2026-08-21
Status: active functional build
Branch policy: active development occurs on `main`; archival branches are rollback snapshots only.

## Product role

BITCOREOS-95 is the unified user-facing projection of BIThub + BITwiki.

The UI should not present BITCOREOS, BIThub, and BITwiki as competing products. Source systems remain authoritative, but they appear as object origin/authority/provenance inside the same interaction shell.

Primary verbs:

- Ask
- Research
- Explore

Global/contextual projections:

- current identity / authority
- Mine filters
- Knowledge Graph inside Explore
- Kordylewski Relay guide

The current `/my` implementation is transitional. Personal state remains useful, but the canonical direction is to distribute it through global identity/Mine projections rather than let `/my` become a second chat/research/explore product.

## Recursive object invariant

Every normalized object should carry:

- kind
- origin
- substrate
- actor/participants
- viewer identity
- authority/visibility
- source ID/URL
- parent/derived/provenance relations
- state
- allowed capabilities

This applies equally to Hub topics/posts/PMs/Chat, CORE activations, agents, Wiki pages/SMW facts, Cargo requests, artifacts, n8n jobs, and local MAS sessions.

## Conversation model correction

Ask is the canonical conversation mode.

Conversation substrates to converge under Ask:

- local grounded Ask conversation
- Discourse private-message topic
- native Discourse Chat channel
- native Discourse Chat direct-message channel
- native Discourse Chat thread
- CORE activation topic/reply trail
- Construct/bot conversation over PM/Chat/topic
- Node interaction
- local MAS session
- selected workflow execution/status projection

A conversation must expose its source and semantics instead of flattening them away.

### CORE correction

COREs are workflow/cognition activators, not merely content spaces.

The current Explore `Cores` category stream is useful as a discovery/catalog projection, but it must not define CORE semantics. A CORE definition, an activation topic, its replies, executor identity, and produced artifacts are distinct linked objects.

## Current implemented functionality

### Public retrieval

- federated BIThub + BITwiki search
- hydrated BIThub topic/post reader
- hydrated BITwiki page reader
- Ask grounded in bounded Hub/Wiki evidence
- Explore Feed/Search/Spaces/Agents
- native Discourse category stream adapter
- public B8 registry projection
- source text normalization

### BITwiki semantics/research

- MediaWiki page hydration with rendered fallback
- SMW runtime diagnostics
- per-subject SMW fact traversal
- secondary Knowledge Graph
- research intent taxonomy: new page, revision, category/navigation, semantic model, Lua projection, reusable artifact, coverage audit
- existing-page/request preflight
- Cargo-first Requested Knowledge reader with explicit `wiki-content` fallback while live Cargo is unhealthy

### Identity and personal state

Application support exists for:

- Anonymous state
- DiscourseConnect SSO session
- scoped Discourse User API Key handshake using RSA/OAEP
- encrypted delegated credential storage
- notifications
- bookmarks/tracking/watching
- public contribution trail
- provisional same-username BITwiki User: namespace/contribution projection

Production `/api/auth/login` generates the correct BIThub DiscourseConnect request and callback host. The provider domain was corrected by the operator to `bitcoreos-95.vercel.app` without protocol. A real successful browser callback still needs verification after that provider-side fix.

### Agents/actions

- public B8 registry reader
- canonical B8 capability vocabulary
- typed BITCOREOS -> n8n action envelope
- correlation and idempotency IDs
- HMAC signing
- server-side risk classification and allowlist

n8n execution is not live until its production endpoint/secret are connected.

## Discourse capability surface confirmed from upstream references

Classic Discourse APIs expose or model:

- topics
- posts/replies
- private messages
- users
- groups
- categories
- tags
- search
- notifications
- user actions/activity
- badges
- polls
- uploads
- invites
- topic bookmarks and notification levels

Native Discourse Chat additionally exposes:

- channels
- current-user channels
- direct-message channels
- messages
- threads
- drafts
- pins
- memberships
- reactions/interactions
- search
- read state
- notification settings
- invites
- archives
- incoming webhooks
- edit/delete/restore/move operations

The Discourse Ask theme itself uses a private message to an AI bot as its question/conversation mechanism. This reinforces Ask-as-conversation rather than a separate personal chat surface.

The separate Chat Integration plugin is an external-chat bridge and is not the same thing as native Discourse Chat.

## Current limitations / gates

- Verify one successful DiscourseConnect callback after provider-domain correction.
- Verify one User API Key approval/callback.
- Determine which native Chat routes are enabled and usable on BIThub with delegated user authority.
- Add PM + Chat normalized adapters.
- Refactor current `/my` personal workspace into identity/Mine projections.
- Refactor CORE representation away from category-as-object semantics.
- Connect `N8N_ACTION_URL` and `N8N_ACTION_SECRET`.
- Repair/deploy live Cargo `Knowledge_requests` if Cargo is to own runtime request state.
- Establish verified BIThub ↔ BITwiki identity before treating MediaWiki User: namespace matches as authenticated ownership.

## UI invariants

- Ask / Research / Explore are first-class verbs.
- Identity is global context, not a competing app.
- Mine is a filter/projection.
- Origin/authority/provenance are visible on every object.
- One underlying object may appear in multiple modes without duplication of authoritative state.
- Front page remains sparse.
- Progressive disclosure over dashboards.
- Knowledge Graph stays secondary to Explore.
- No command palette.
- No fake controls.
- No developer/configuration metalanguage on public surfaces.
- Real badges/activity/gamification signals are acceptable; invented decorative XP is not.
