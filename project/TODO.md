# BITCOREOS-95 — TODO

Updated: 2026-08-21

## Completed foundations

- [x] Federated BIThub + BITwiki search.
- [x] BIThub topic/post hydration.
- [x] BITwiki page hydration.
- [x] Internal source reader.
- [x] Grounded Ask evidence.
- [x] Research evidence/preflight.
- [x] Anonymous state + BIThub SSO initiation.
- [x] Scoped Discourse User API Key handshake implementation.
- [x] Notifications/bookmarks/tracking/watching adapters.
- [x] B8 agent registry projection.
- [x] SMW subject traversal.
- [x] Requested Knowledge Cargo-first adapter with source fallback.
- [x] Guarded n8n action-envelope implementation.

## Active — unified object model

- [ ] Add one normalized recursive context/object envelope used by Ask, Research, Explore, identity projections, and Graph.
- [ ] Add explicit origin, substrate, actor/participants, authority, visibility, provenance, state, and capabilities to normalized objects.
- [ ] Support parent/derived/produced/canonicalized relationships without inventing duplicate canonical state.
- [ ] Make object capability rendering depend on current viewer authority.

## Active — Ask as universal conversation mode

- [ ] Keep local grounded Ask as one conversation substrate, not the definition of Ask.
- [ ] Add delegated Discourse PM conversation list.
- [ ] Add PM topic/post hydration and reply trail.
- [ ] Detect native Discourse Chat availability on BIThub.
- [ ] Add delegated Chat channel list.
- [ ] Add Chat direct-message channels.
- [ ] Add Chat messages.
- [ ] Add Chat threads.
- [ ] Add Chat read/unread state, drafts, pins, and reactions where useful.
- [ ] Render PM, Chat, CORE activation, Construct conversation, Node interaction, and local session through one conversation UI with explicit substrate badges.
- [ ] Add conversation filters: All / Unread / PM / Chat / CORE / Constructs / Nodes / Local.
- [ ] Make conversation writes route through the correct authority path; sensitive mutations remain guarded by n8n by default.

## Active — CORE semantics correction

- [ ] Stop treating the Discourse Cores category as the semantic CORE object.
- [ ] Model CORE definition separately from CORE activation.
- [ ] Represent activation topic/post/reply trail as conversation objects with `substrate=core_activation`.
- [ ] Link activation -> CORE -> executor -> outputs/artifacts.
- [ ] Keep the Cores category only as a discovery/catalog projection where useful.
- [ ] Allow CORE selection from Ask and Research when the current authority permits activation.

## Active — identity/Mine refactor

- [ ] Keep current identity persistently visible in shell chrome.
- [ ] Replace conceptual "My BIThub" product split with identity/Mine projections.
- [ ] Ask → My conversations, unread, bots, CORE activations, local sessions.
- [ ] Research → My requests, executions, reviews, outputs.
- [ ] Explore → My topics/posts, saved/watched, notifications, badges, wiki contributions, user namespace.
- [ ] Preserve a compact identity/profile drawer for denser organization without duplicating the three modes.
- [ ] Verify one successful DiscourseConnect callback after provider-domain correction.
- [ ] Verify one User API Key approval/callback.
- [ ] Later unify verified BIThub identity with BITwiki User: namespace ownership.

## Active — Explore refactor

- [ ] Treat Hub/Wiki as origin filters/facets, not competing top-level systems.
- [ ] Browse topics, posts, PMs where authorized, users, groups, categories, tags, agents, Nodes, CORE definitions/activations, artifacts, workspaces, feeds, markets.
- [ ] Browse Wiki pages, revisions, categories, templates, Lua modules, SMW subjects/Properties/assertions, Cargo records, user namespaces/contributions.
- [ ] Browse runtime objects: research requests, workflow runs, evidence packets, local MAS sessions, n8n job status.
- [ ] Keep Feed and Search cognitively simple.
- [ ] Keep Graph secondary and drive it from the same normalized object/provenance relations.

## Active — Research generalized inputs/outputs

- [ ] Accept any normalized object as Research source context.
- [ ] Support conversation → research request.
- [ ] Support CORE/Construct/Node/local-MAS output → research request.
- [ ] Support page/category/SMW Property/Lua/template/artifact as research targets.
- [ ] Decide whether intent requires new page, revision, category/nav, semantic schema/assertion, Lua projection, reusable artifact, request set, provenance repair, or no new durable object.
- [ ] Keep knowledge lifecycle separate from execution lifecycle.

## Infrastructure gates

- [ ] Configure `N8N_ACTION_URL`.
- [ ] Configure `N8N_ACTION_SECRET`.
- [ ] Verify one guarded n8n action round trip.
- [ ] Repair/deploy live Cargo `Knowledge_requests`.
- [ ] Verify Cargo lifecycle transitions after repair.

## Next — real Deploy Research

- [ ] Connect `research.deploy` to the real n8n workflow.
- [ ] Create/update authoritative Requested Knowledge state.
- [ ] Create or attach the appropriate Hub work/conversation trail.
- [ ] Select/dispatch B8-compatible agents, COREs, Nodes, or local/runtime executors.
- [ ] Observe execution state.
- [ ] Collect evidence/artifacts.
- [ ] Produce reviewable source-controlled BITwiki candidate changes.
- [ ] Preserve provenance request -> conversation/work -> executor -> evidence -> artifact -> candidate -> canonical page.

## UI rules

- Ask / Research / Explore are first-class verbs.
- Identity is global context; Mine is a filter.
- Every object exposes origin, identity, authority, provenance.
- Front page remains sparse.
- Progressive disclosure over dashboards.
- No command palette.
- No fake controls.
- No developer/configuration metalanguage on public surfaces.
- Real Discourse badges/gamification/activity may be surfaced; do not invent meaningless XP.
