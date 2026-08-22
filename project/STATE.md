# BITCOREOS-95 — Current State

Updated: 2026-08-21
Status: active functional build
Branch policy: active development occurs on `main`; archival branches are rollback snapshots only.

## Product role

BITCOREOS-95 is the unified user-facing projection of BIThub + BITwiki.

The UI does not treat BITCOREOS, BIThub, and BITwiki as competing products. Authoritative substrates remain distinct internally and are exposed through object origin, authority, visibility, identity, and provenance.

Primary verbs:

- Ask
- Research
- Explore

Global/contextual projections:

- current identity / authority
- Mine lens
- Knowledge Graph inside Explore
- Kordylewski Relay guide

`/my` is now an **Identity / Mine projection**, not a separate product and not a second conversation surface. Conversations belong to Ask.

## Recursive object invariant

Every normalized object may carry one `ContextCapsule` describing:

- kind
- origin plane
- concrete substrate/transport
- actor/participants/executor
- viewer identity when relevant
- authority + visibility
- canonical/source reference
- state
- provenance relations
- allowed/possible capabilities
- bounded metadata

The shared envelope is implemented for conversations, federated Hub/Wiki search resources, native category resources, CORE runs, and Research source context. Capability lists still need to become fully viewer-authority-aware before write controls are exposed broadly.

## Conversation model

Ask is the canonical conversation mode.

Implemented conversation substrates:

- local grounded Ask conversation
- public CORE activation topic/reply trail
- delegated classic Discourse PM topic
- delegated Discourse AI / Construct conversation
- native Discourse Chat channel
- native Discourse Chat direct-message channel
- native Discourse Chat thread

Mode semantics:

- local Ask: local/AI invoke
- public CORE run: public topic-backed workflow conversation
- classic PM: private topic-backed conversation
- Construct: executor identity over its authoritative conversation transport, commonly PM-backed
- public Chat channel: public conversation semantic visibility; the deployment may still require an authenticated API call for discovery/read
- Chat DM: private native-Chat conversation
- Chat thread: child conversation inheriting channel authority

Ask uses low-noise filters: `All / Local / PM + Bots / Chat / Runs`. Each object still shows its exact substrate badge/context.

Node and MAS conversation projections remain next adapters; their transport must be discovered per object rather than assumed.

## CORE semantics

CORE is a workflow/cognition capability, not a category.

Implemented distinctions:

- **CORE definition** — catalog/capability object
- **CORE activation/run** — normal Discourse topic/post/reply trail that activates the workflow
- **CORE executor identity** — carried separately in context
- **outputs/artifacts** — future linked objects when stable execution metadata exposes them

The Discourse Cores category remains useful only as catalog/discovery + activation index. Its topics are now classified as definitions or runs instead of treating the category as the semantic CORE object.

Public CORE runs are available in Ask without private authority and can be passed directly into Research with provenance preserved.

## Explore model

Explore is universal object navigation, not “BIThub vs BITwiki.”

Current surfaces:

- Feed
- Search
- Spaces
- Agents
- source reader
- secondary Knowledge Graph

Hub/Wiki are origin facets. Search and category resources now carry recursive context. Cores category resources preserve definition/run semantics.

Still needed:

- compact context capsule in the reader
- user/group/tag/post object views
- Mine filters
- delegated private objects where useful
- richer Wiki object families: revisions, templates, Lua modules, Properties/assertions, Cargo records, backlinks, user namespaces
- runtime/workflow objects
- Graph driven from the same normalized provenance objects rather than its own parallel model

## Research model

Research accepts either free user intent or an existing normalized source object.

Implemented request/output intents:

- new page
- existing-page revision
- category/navigation
- SMW semantic model
- Lua/computed projection
- reusable artifact
- coverage audit

Research now preserves an incoming conversation/resource `ContextCapsule` through:

`source object -> research preflight -> evidence discovery -> research packet -> guarded dispatch payload`

This allows PM, Construct, Chat, CORE run, discussion, or Wiki object to become research context without flattening its identity/authority/provenance.

Knowledge lifecycle remains separate from execution lifecycle.

## BITwiki semantics/research

Implemented:

- MediaWiki page hydration with rendered fallback
- SMW runtime diagnostics
- per-subject SMW fact traversal
- secondary Knowledge Graph
- existing-page/request preflight
- Cargo-first Requested Knowledge reader with explicit `wiki-content` fallback while live Cargo is unhealthy
- full-text/search/page object contexts

Current live limitation: Cargo `Knowledge_requests` is not healthy in the deployed wiki runtime, so source-controlled request records remain the explicit fallback.

## Identity + Mine

Application support exists for:

- explicit Anonymous state
- DiscourseConnect SSO session
- scoped Discourse User API Key handshake using RSA/OAEP
- encrypted delegated credential storage
- public contribution trail
- trust/activity/likes metrics
- authoritative Discourse user badges
- notifications
- bookmarks/tracking/watching
- provisional same-username BITwiki User: namespace/contribution projection

Mine is deliberately small and progressively disclosed:

- Activity
- Knowledge
- Saved + inbox

Real Discourse badges are used as earned/account signals. No fabricated XP is introduced.

Production `/api/auth/login` generates the correct BIThub DiscourseConnect request and callback host. The provider domain was corrected by the operator to `bitcoreos-95.vercel.app` without protocol. A successful real browser callback must still be verified after that provider-side change.

## Agents / B8

Implemented:

- public B8 registry reader
- canonical B8 capability vocabulary
- agent/Construct discovery

`bitwikiorg/agent.b8-plugin` remains the canonical agent-facing capability family. B8 is an adapter/capability vocabulary, not a competing UI product.

## Guarded execution / n8n

Implemented in application code:

- typed BITCOREOS -> n8n action envelope
- actor / target / payload / source context
- correlation ID
- idempotency key
- risk class
- timestamp
- HMAC signing
- server-side action allowlist/risk classification

Canonical execution boundary:

`guard -> execute -> verify`

n8n remains appropriate for sensitive/cross-system writes, secret-bearing workflows, guarded dispatch, retries, prompt-injection/jailbreak-sensitive actions, and publication pipelines. It should not proxy harmless public reads.

The n8n broker is not live until its production URL/secret are connected and one real round trip is verified.

## Authoritative API map

`project/API_SURFACES.md` is the current capability inventory and mapping from upstream Discourse/MediaWiki/B8 surfaces into Ask / Research / Explore / Mine.

Upstream references audited include:

- `discourse/discourse`
- `discourse/discourse-ask-theme`
- `discourse/discourse-chat-integration`
- `discourse/discourse-just-chat`
- `discourse/discourse_api`
- `discourse/discourse_api_docs`
- `bitwikiorg/agent.b8-plugin`

Important confirmed first-party families include forum topics/posts/PMs, users/groups/categories/tags/search, notifications, bookmarks/tracking/watch state, badges, native Chat channels/DMs/messages/threads/pins/reactions/drafts/search/read state, Discourse AI conversations/artifacts/search helpers, User API keys, MessageBus, MediaWiki, SMW, and Cargo.

## Current verification / infrastructure gates

- Verify one successful DiscourseConnect browser callback after provider-domain correction.
- Verify one User API Key approval/callback.
- Verify delegated PM / Construct / Chat adapters against a real signed-in account.
- Dynamically constrain write capabilities to actual delegated scopes/authority.
- Add correct PM reply / Chat send / CORE activation paths.
- Configure `N8N_ACTION_URL` and `N8N_ACTION_SECRET` and verify guarded execution.
- Repair/deploy live Cargo `Knowledge_requests` if Cargo is to own runtime request state.
- Establish verified BIThub ↔ BITwiki identity before treating MediaWiki User: namespace matches as authenticated ownership.
- Add Node/MAS/local-runtime adapters using their actual transports.

## UI invariants

- Ask / Research / Explore are first-class verbs.
- Identity is global context; Mine is a lens.
- Conversations belong to Ask regardless of transport.
- Origin/authority/provenance are visible but not cognitively dominant.
- One underlying object may appear in multiple modes without duplicating authoritative state.
- Front page remains sparse.
- Progressive disclosure over dashboards.
- Knowledge Graph stays secondary to Explore.
- No command palette.
- No fake controls.
- No developer/configuration metalanguage on public surfaces.
- Real badges/activity/gamification signals are acceptable; invented decorative XP is not.
