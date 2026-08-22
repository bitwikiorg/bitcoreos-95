# BITCOREOS-95 — TODO

Updated: 2026-08-22

## Immediate next action

- [ ] **Rebuild current `main` and verify a READY Vercel production deployment before further feature work.** Latest known READY production commit during this session was `bec7931`; a later build at `da8befc` failed, its TypeScript error was fixed, and additional commits landed afterward.
- [ ] Smoke-test `/`, `/ask`, `/explorer`, `/research`, `/ontology`, `/api/conversations`, `/api/agents`, `/api/wiki/directory`, and entity-aware `/api/search` on the verified deployment.

## Completed foundations

- [x] Federated BIThub + BITwiki search and hydration.
- [x] Internal source reader and grounded Ask evidence.
- [x] Research evidence/preflight and Requested Knowledge adapter.
- [x] Anonymous state + DiscourseConnect SSO initiation.
- [x] Scoped Discourse User API Key handshake implementation.
- [x] Notifications/bookmarks/tracking/watching adapters.
- [x] B8 actor registry projection.
- [x] SMW subject traversal.
- [x] Guarded n8n action-envelope implementation.

## Completed — recursive object model

- [x] Shared `ContextCapsule` for origin, substrate, identity, authority, visibility, provenance, state, capabilities, and metadata.
- [x] Conversation objects use the shared context envelope.
- [x] Federated Hub/Wiki search resources carry recursive context.
- [x] Native category resources carry recursive context.
- [x] CORE activation provenance links activation -> CORE.
- [x] Research preserves an incoming object's context/provenance through planning and dispatch payloads.
- [x] Separate actor/profile `identity.subject` from conversation/workflow `identity.executor`.
- [x] Preserve normalized focus objects through Explore -> Ask -> Research.
- [x] Re-resolve B8 actor focus server-side before treating registry identity as authoritative evidence.
- [ ] Make every capability list depend dynamically on current viewer authority rather than semantic possibility.
- [ ] Expand produced/derived/canonicalized relations as real execution and publication data becomes available.

## Completed — Ask as universal conversation mode

- [x] Local grounded Ask remains one conversation substrate.
- [x] Local Ask conversations are first-class recursive objects.
- [x] Migrate old browser-local Ask records into the recursive object envelope.
- [x] Preserve focused public objects across local Ask turns.
- [x] Focused public objects become first-class grounded evidence in `/api/ask`.
- [x] Local Ask -> Research preserves transcript, focus, and ContextCapsule.
- [x] Delegated classic PM list + full topic/post trail.
- [x] Discourse AI / Construct conversation list.
- [x] Native Chat channel and Chat-DM list adapters.
- [x] Native Chat message reads.
- [x] Native Chat thread list/read adapters.
- [x] Public Chat channels are modeled as public; Chat DMs remain private.
- [x] Public CORE activations appear in Ask for anonymous and signed-in users.
- [x] Public CORE topic/reply trails can be read without delegated private authority.
- [x] Full CORE reads recover real first-author + participant identity from thread data.
- [x] Unified transcript UI preserves exact substrate badges and context.
- [x] Low-noise filters retain Local / PM + Bots / Chat / Runs with Mine as a lens.
- [x] Conversation -> Research preserves the source ContextCapsule.
- [ ] Verify delegated PM/Construct/Chat endpoints with one real User API Key approval.
- [ ] Add useful Chat pins/reactions/drafts/search/read-state controls incrementally rather than dumping the entire API into the default UI.
- [ ] Add write/reply/activation controls through the correct authority path; sensitive mutations remain guarded by n8n.

## Completed — CORE / Node semantics correction

- [x] CORE is modeled as a workflow/cognition capability, not a category.
- [x] Distinguish Cores category guide from CORE definitions and CORE activation/runs.
- [x] Cores category remains catalog/discovery + activation index only.
- [x] CORE activation topic/post/reply trail is a public Ask conversation substrate.
- [x] Activation carries executor + `activates` provenance.
- [x] Stop using list `last_poster_username` as authoritative topic author.
- [x] Distinguish Nodes category guide from Node definitions and private/runtime Node interactions.
- [ ] Link actual produced artifacts/outputs once execution metadata exposes stable identifiers.
- [ ] Add guarded CORE activation from Ask/Research.
- [ ] Add Node interaction adapters only after authoritative per-Node transport is identified.

## Completed — identity / Mine

- [x] Current viewer identity remains persistently visible in shell chrome.
- [x] `/my` is Identity / Mine projection rather than a second product surface.
- [x] Conversations remain in Ask rather than Identity.
- [x] Identity/Mine exposes activity, contribution mix, saved/watched state, notifications, badges, and Wiki username/namespace projection.
- [x] Anonymous is shown explicitly and can sign in from shell or Identity.
- [x] Add Mine lens to Ask.
- [x] Add normalized Mine resource feed to Explore: authored topics/replies, saved/tracked/watched objects, notifications, badges, Wiki revisions/contributions.
- [ ] Verify one successful DiscourseConnect callback after provider-domain correction.
- [ ] Verify one User API Key approval/callback.
- [ ] Later unify verified Discourse identity with MediaWiki `User:` namespace ownership.

## Completed / active — Explore as universal object navigation

- [x] Hub/Wiki remain origin facets, not top-level product modes.
- [x] Feed, Search, Spaces, Actors, Mine, source reader, and secondary Graph remain progressively disclosed.
- [x] Rename misleading Agents lens to **Actors**.
- [x] Normalize registry rows into Construct / MAS actor / persona / provider actor objects.
- [x] Actor objects use the same select -> inspect -> Ask -> Research pipeline as other objects.
- [x] Search and category rows carry normalized object context.
- [x] Compact object context is visible in the reader.
- [x] Begin entity-aware Discourse Search normalization for users, groups, tags, and categories.
- [x] Add namespace-driven BITwiki structural directories: Categories, Templates, Lua Modules, Property pages.
- [x] Structural Wiki objects hand off to Research with appropriate starting intent.
- [ ] Verify all newly landed Explore object families in a clean production build.
- [ ] Add explicit post/reply object views outside Mine where useful.
- [ ] Add delegated private objects only when authority permits.
- [ ] Add useful Chat channels/threads to Explore as navigation objects; interaction remains in Ask.
- [ ] Expand Wiki navigation further: revisions/history browser, SMW assertions, Cargo rows, backlinks, user namespaces/contributions.
- [ ] Browse runtime objects: workflow runs, research jobs, evidence packets, local MAS sessions, n8n status.
- [ ] Drive Graph from these same normalized objects/provenance relations.

## Completed — Research generalized inputs/outputs

- [x] Accept a normalized ContextCapsule as Research source context.
- [x] Conversation / CORE run / Construct / Chat object -> Research source context.
- [x] Explore selected object -> Research preserves the actual normalized object context.
- [x] Preserve source object identity, origin, authority, and provenance in the research packet.
- [x] Support new page, revision, category/navigation, semantic model, Lua projection, reusable artifact, and coverage audit intents.
- [x] Infer useful starting intent for selected Category / Property / Lua Module / Wiki page objects.
- [x] Keep knowledge lifecycle separate from execution lifecycle.
- [ ] Expand automatic output-choice heuristics beyond the current structural handoff rules.
- [ ] Add direct assertion/template/artifact target pickers where they materially reduce friction.

## Infrastructure gates

- [ ] Complete one real DiscourseConnect browser round trip after provider host was corrected to `bitcoreos-95.vercel.app`.
- [ ] Complete one real delegated User API Key approval/callback.
- [ ] Verify delegated PM / Construct / Chat adapters with the approved key.
- [ ] Configure `N8N_ACTION_URL`.
- [ ] Configure `N8N_ACTION_SECRET`.
- [ ] Verify one guarded n8n action round trip.
- [ ] Repair/deploy live Cargo `Knowledge_requests` and verify lifecycle transitions.

## Next — real Deploy Research

- [ ] Connect `research.deploy` to the real n8n workflow.
- [ ] Create/update authoritative Requested Knowledge state.
- [ ] Create or attach the appropriate discussion/conversation/work trail.
- [ ] Select/dispatch B8-compatible Actors, COREs, Nodes, or local/runtime executors using real authority/transport.
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
