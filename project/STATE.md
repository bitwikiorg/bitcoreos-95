# BITCOREOS-95 — Current State

Updated: 2026-08-22
Status: active functional build; latest `main` ahead of last verified production deployment
Branch policy: active development occurs on `main`; archival branches are rollback snapshots only.

## Session checkpoint

Current `main` head at wrap-up: `c7dd58ef7116891a4bb24631b15798b0fb66be6e`.

Last verified READY production deployment in this session: commit `bec7931d8ab6c4ad01efa174555d78b6add42c21` (`feat: make local Ask conversations recursive objects`).

A later production build at commit `da8befc05f280ef2e08b0ea25677475d98a1ccdf` failed on a TypeScript null-narrowing error in `app/api/wiki/directory/route.ts`. The specific compiler error was fixed on `main` at `c56d4b9dc35c20f538e1fb26c6666378abdbd26e`. Additional semantic/object work landed afterward. No newer READY deployment was observed before session wrap-up, so the latest head must be rebuilt and verified before further feature work.

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

`/my` is an **Identity / Mine projection**, not a separate product and not a second conversation surface. Conversations belong to Ask.

## Recursive object invariant

Every normalized object may carry one `ContextCapsule` describing:

- kind
- origin plane
- concrete substrate/transport
- subject identity
- actor/participants/executor when applicable
- viewer identity when relevant
- authority + visibility
- canonical/source reference
- state
- provenance relations
- allowed/possible capabilities
- bounded metadata

Identity semantics were tightened this session: **an actor/profile object is the subject; a conversation/workflow may have an executor**. These are no longer conflated.

Capability lists still need to become fully viewer-authority-aware before write controls are exposed broadly.

## Ask / conversation state

Ask is the canonical conversation mode.

Implemented conversation substrates:

- local grounded Ask conversation
- public CORE activation topic/reply trail
- delegated classic Discourse PM topic
- delegated Discourse AI / Construct conversation
- native Discourse Chat channel
- native Discourse Chat direct-message channel
- native Discourse Chat thread

New this session:

- local Ask conversations are first-class recursive objects with local origin/authority/provenance
- older browser-local chats are migrated into the object envelope
- Explore -> Ask now carries the selected normalized object rather than only text
- public focus objects are re-hydrated server-side and become privileged focus evidence
- actor focus is re-resolved against the canonical B8 registry rather than trusting browser metadata
- local Ask preserves focused-object provenance across turns
- local Ask -> Research preserves transcript/focus/context
- Ask includes a real Mine lens rather than keeping personal conversation state in a separate product surface

Public CORE conversation reads were verified live during this session. Full thread reads recover the real first author and participants.

Still unverified: delegated PM/Construct/Chat reads against one real approved User API Key.

## CORE / Node semantics

CORE remains a workflow/cognition capability, not a category.

Current distinctions:

- category guide
- CORE definition
- CORE activation/run
- executor identity
- future outputs/artifacts when stable identifiers exist

The category normalizer was corrected to avoid treating every `About ...` topic as the same semantic object and to avoid treating the last poster as the author.

Node semantics were also kept conservative:

- Nodes category guide != Node definition != private/runtime Node interaction
- public catalog material is discoverable
- private Node runtime semantics are not fabricated without authoritative transport data

## Explore state

Explore is universal object navigation, not “BIThub vs BITwiki.”

Current/landed surfaces:

- Feed
- Search
- Spaces
- Actors
- Mine
- source reader
- secondary Knowledge Graph

New this session:

- `Mine` projects real authored topics/replies, saved/tracked/watched state, notifications, badges, and Wiki contributions through normalized resources
- old `Agents` view was corrected to **Actors** because the registry mixes Constructs, MAS actors/kernels, personas, and provider-backed actors
- actor rows are selectable objects and use the same inspect -> Ask -> Research pipeline
- actor `subject` identity is distinct from conversation/workflow `executor`
- Cores category preserves category-guide / definition / run distinctions
- Wiki structural directories were added using MediaWiki namespaces rather than assuming SMW browse results: Categories, Templates, Lua Modules, and Property pages
- Research handoff infers structural intent for Category / Property / Lua Module / ordinary Wiki page
- federated Search now begins normalizing Discourse users, groups, tags, and categories when returned by the upstream search payload
- matched reply authors are no longer falsely labeled as topic authors

The new Wiki directory / Actors / entity-search work is on `main` but still requires a clean production build verification.

## Research state

Research accepts either free user intent or an existing normalized source object.

Implemented request/output intents:

- new page
- existing-page revision
- category/navigation
- SMW semantic model
- Lua/computed projection
- reusable artifact
- coverage audit

Research preserves incoming object context through:

`source object -> research preflight -> evidence discovery -> research packet -> guarded dispatch payload`

New this session: Explore objects and local Ask conversations preserve the actual source object across mode transitions, and structural Wiki objects seed the appropriate Research intent.

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
- namespace-driven structural directories for Category / Template / Module / Property

Current live limitation: SMW property browse returned zero rows during this session, so structural discovery intentionally uses the deployed MediaWiki namespace registry instead of assuming an SMW response shape.

Cargo `Knowledge_requests` remains unhealthy in the deployed wiki runtime; source-controlled request records remain the explicit fallback.

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

Mine remains a lens, not another product. This session expanded Mine into Ask and Explore while retaining Identity as global context.

A successful real DiscourseConnect browser callback and a real delegated User API Key approval remain external verification gates.

## Actors / B8

Implemented:

- public B8 registry reader
- canonical B8 capability vocabulary
- normalized actor resources
- actor semantic classes: Construct / MAS actor / persona / provider actor
- server-side registry re-resolution for focused Ask grounding

B8 is an adapter/capability vocabulary, not a competing UI product.

## Guarded execution / n8n

Application code still includes the typed BITCOREOS -> n8n action envelope, HMAC signing, risk classification, correlation/idempotency fields, and the `guard -> execute -> verify` boundary.

The n8n broker is not live until `N8N_ACTION_URL` and `N8N_ACTION_SECRET` are configured and a real round trip is verified.

## Current verification / infrastructure gates

Priority order at wrap-up:

1. **Rebuild current `main` and verify a READY production deployment.** Do not continue feature work on top of an unverified head.
2. Verify the new public routes/surfaces after deploy: Actors, Mine, Wiki directories, entity-aware Search, focused Ask.
3. Verify one successful DiscourseConnect browser callback.
4. Verify one User API Key approval/callback.
5. Verify delegated PM / Construct / Chat adapters against a real signed-in account.
6. Dynamically constrain write capabilities to actual delegated scopes/authority.
7. Add correct PM reply / Chat send / CORE activation paths.
8. Configure n8n URL/secret and verify guarded execution.
9. Repair/deploy Cargo `Knowledge_requests` if Cargo is to own runtime request state.
10. Add Node/MAS/local-runtime adapters only from their actual transports.

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
