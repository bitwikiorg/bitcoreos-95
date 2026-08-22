# BITCOREOS-95 — TODO

Updated: 2026-08-21

## Completed foundations

- [x] Federated BIThub + BITwiki search and hydration.
- [x] Internal source reader and grounded Ask evidence.
- [x] Research evidence/preflight and Requested Knowledge adapter.
- [x] Anonymous state + DiscourseConnect SSO initiation.
- [x] Scoped Discourse User API Key handshake implementation.
- [x] Notifications/bookmarks/tracking/watching adapters.
- [x] B8 agent registry projection.
- [x] SMW subject traversal.
- [x] Guarded n8n action-envelope implementation.

## Implemented — recursive object model

- [x] Shared `ContextCapsule` for origin, substrate, identity, authority, visibility, provenance, state, capabilities, and metadata.
- [x] Conversation objects use the shared context envelope.
- [x] Federated Hub/Wiki search resources carry recursive context.
- [x] Native category resources carry recursive context.
- [x] CORE activation provenance links activation -> CORE.
- [x] Research preserves an incoming object's context/provenance through planning and dispatch payloads.
- [ ] Make every capability list depend dynamically on current viewer authority rather than semantic possibility.
- [ ] Expand produced/derived/canonicalized relations as real execution and publication data becomes available.

## Implemented — Ask as universal conversation mode

- [x] Local grounded Ask remains one conversation substrate.
- [x] Delegated classic PM list + full topic/post trail.
- [x] Discourse AI / Construct conversation list.
- [x] Native Chat channel and Chat-DM list adapters.
- [x] Native Chat message reads.
- [x] Native Chat thread list/read adapters.
- [x] Public Chat channels are modeled as public; Chat DMs remain private.
- [x] Public CORE activations appear in Ask for anonymous and signed-in users.
- [x] Public CORE topic/reply trails can be read without delegated private authority.
- [x] Unified transcript UI preserves exact substrate badges and context.
- [x] Low-noise filters: All / Local / PM + Bots / Chat / Runs.
- [x] Conversation -> Research preserves the source ContextCapsule.
- [ ] Verify delegated PM/Construct/Chat endpoints with one real User API Key approval.
- [ ] Add useful Chat pins/reactions/drafts/search/read-state controls incrementally rather than dumping the entire API into the default UI.
- [ ] Add write/reply/activation controls through the correct authority path; sensitive mutations remain guarded by n8n.

## Implemented — CORE semantics correction

- [x] CORE is modeled as a workflow/cognition capability, not a category.
- [x] CORE definition is distinct from CORE activation.
- [x] Cores category is retained only as catalog/discovery + activation index.
- [x] Cores category topics are semantically classified as definitions or activation runs.
- [x] CORE activation topic/post/reply trail is a public Ask conversation substrate.
- [x] Activation carries executor + `activates` provenance.
- [ ] Link actual produced artifacts/outputs once execution metadata exposes stable identifiers.
- [ ] Add guarded CORE activation from Ask/Research.

## Implemented — identity/Mine correction

- [x] Current viewer identity remains persistently visible in shell chrome.
- [x] Removed the conceptual "My BIThub" product split; `/my` is now `Identity` / Mine projection.
- [x] Conversations remain in Ask rather than Identity.
- [x] Identity/Mine exposes activity, contribution mix, saved/watched state, notifications, and Wiki username/namespace projection.
- [x] Anonymous is shown explicitly and can sign in from shell or Identity.
- [ ] Verify one successful DiscourseConnect callback after provider-domain correction.
- [ ] Verify one User API Key approval/callback.
- [ ] Add Mine filters directly inside Research and Explore where useful.
- [ ] Later unify verified Discourse identity with MediaWiki `User:` namespace ownership.

## Active — Explore as universal object navigation

- [x] Hub/Wiki remain origin facets, not top-level product modes.
- [x] Feed, Search, Spaces, Agents, source reader, and secondary Graph remain progressively disclosed.
- [x] Cores catalog preserves CORE definition/run semantics.
- [x] Search and category rows carry normalized object context.
- [ ] Surface the context capsule compactly in the reader without increasing default density.
- [ ] Add user/group/tag/post object views and Mine filters.
- [ ] Add delegated private objects only when authority permits.
- [ ] Add useful Chat channels/threads to Explore as objects where navigation adds value; interaction remains in Ask.
- [ ] Expand Wiki object navigation: revisions, templates, Lua modules, SMW Properties/assertions, Cargo records, backlinks, user namespaces/contributions.
- [ ] Browse runtime objects: workflow runs, research jobs, evidence packets, local MAS sessions, n8n status.
- [ ] Drive Graph from these same normalized objects/provenance relations.

## Implemented — Research generalized inputs/outputs

- [x] Accept a normalized ContextCapsule as Research source context.
- [x] Conversation / CORE run / Construct / Chat object -> Research source context.
- [x] Preserve source object identity, origin, authority, and provenance in the research packet.
- [x] Support new page, revision, category/navigation, semantic model, Lua projection, reusable artifact, and coverage audit intents.
- [x] Keep knowledge lifecycle separate from execution lifecycle.
- [ ] Expand automatic output-choice heuristics beyond the current explicit intent control.
- [ ] Add direct SMW Property/Lua/template/artifact target pickers from Explore.

## Infrastructure gates

- [ ] Complete one real DiscourseConnect browser round trip after provider host was corrected to `bitcoreos-95.vercel.app`.
- [ ] Complete one real delegated User API Key approval/callback.
- [ ] Configure `N8N_ACTION_URL`.
- [ ] Configure `N8N_ACTION_SECRET`.
- [ ] Verify one guarded n8n action round trip.
- [ ] Repair/deploy live Cargo `Knowledge_requests` and verify lifecycle transitions.

## Next — real Deploy Research

- [ ] Connect `research.deploy` to the real n8n workflow.
- [ ] Create/update authoritative Requested Knowledge state.
- [ ] Create or attach the appropriate discussion/conversation/work trail.
- [ ] Select/dispatch B8-compatible agents, COREs, Nodes, or local/runtime executors.
- [ ] Observe execution state and collect evidence/artifacts.
- [ ] Produce reviewable source-controlled BITwiki candidate changes.
- [ ] Preserve provenance request -> conversation/work -> executor -> evidence -> artifact -> candidate -> canonical page.

## UI rules

- Ask / Research / Explore are first-class verbs.
- Identity is global context; Mine is a lens.
- Conversations belong to Ask regardless of transport.
- Origin is visible but not cognitively dominant.
- Front page remains sparse; progressive disclosure over dashboards.
- Knowledge Graph remains secondary under Explore.
- No command palette, fake controls, or developer/configuration metalanguage on public surfaces.
- Real Discourse badges/gamification/activity may be surfaced; do not invent meaningless XP.
