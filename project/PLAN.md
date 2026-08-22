# BITCOREOS-95 — Canonical Plan

Updated: 2026-08-22

## Product identity

BITCOREOS-95 is the unified interaction projection of BIThub + BITwiki. The user should not have to think of the shell, BIThub, and BITwiki as separate products.

Authoritative state still remains where it belongs:

- Discourse / BIThub: live discussion, PMs, Chat, users, groups, categories, tags, notifications, interaction state, bot/actor work trails.
- MediaWiki / BITwiki: durable pages, revisions, categories, templates, Lua modules, semantic assertions, user namespaces, and canonical knowledge.
- Cargo: bounded operational records when deployed and healthy.
- n8n: guarded privileged execution, sensitive writes, secrets, retries, and multi-system transactions.
- local runtimes / MAS factories: ephemeral execution and conversation state until deliberately persisted elsewhere.

## First-class grammar

The top-level product grammar remains intentionally small:

- **Ask** — converse with any supported conversational object or runtime.
- **Research** — turn any object, question, gap, or conversation into structured knowledge work.
- **Explore** — find and navigate any object in the ecosystem.

Identity is global shell state. **Mine is a lens.** Knowledge Graph is a secondary Explore projection. The lander remains sparse.

## Recursive object model

Every object shown anywhere in BITCOREOS-95 should carry one contextual envelope with:

- stable normalized + authoritative source identity
- kind
- origin
- substrate
- `identity.subject` for the object/person/actor itself
- `identity.executor` only when a conversation/workflow/run has an executor
- participants / author / viewer where applicable
- authority + visibility
- provenance
- state
- capabilities
- bounded metadata

The critical invariant is now operational across the main read surfaces:

`Explore object -> Ask focus/conversation -> Research source -> guarded execution payload`

The same underlying object should survive mode changes without being flattened to display text.

## Milestone state

### M1 — Unified interaction grammar: complete

- Ask / Research / Explore are the first-class verbs.
- Identity is global context; Mine is a lens.
- Front page remains orientation/entry rather than dashboard.

### M2 — Recursive read model: substantially complete

Implemented:

- recursive ContextCapsules
- federated Hub/Wiki resources
- local Ask as recursive object
- PM / Construct / native Chat / CORE conversation adapters
- focused-object grounding in Ask
- Research source preservation
- Mine projections
- Actor registry objects
- CORE definition/run semantics
- Wiki Category / Template / Lua Module / Property directory objects
- initial Discourse User / Group / Tag / Category search objects

Remaining in this milestone:

- clean build + production verification of the newest head
- viewer-authority-aware capability computation
- more runtime object families
- deeper Wiki relations/revisions/Cargo/backlinks
- Graph fed from the same normalized provenance layer

### M3 — Verified identity/private authority: pending external verification

- complete one real DiscourseConnect callback
- complete one real User API Key approval/callback
- verify PM / Construct / Chat reads with that authority
- derive available capabilities from actual delegated scopes

### M4 — Governed mutation/execution: pending infrastructure

- correct PM reply / Chat send / CORE activation routes
- connect n8n broker URL + secret
- verify signed guarded round trip
- connect `research.deploy`
- collect execution status/evidence/artifacts

### M5 — Durable publication/provenance: pending

- authoritative Requested Knowledge lifecycle
- source-controlled BITwiki candidate changes
- evidence/artifact/candidate/canonical provenance chain
- stable produced/derived/canonicalized relations

## Ask = universal conversation mode

Current supported substrates:

1. local grounded Ask
2. public CORE activation topic/reply trail
3. delegated classic Discourse PM
4. delegated Discourse AI / Construct conversation
5. native Chat channel
6. native Chat DM
7. native Chat thread

Next conversation work should **not** add more transports by name alone. Add Node/MAS/runtime conversations only after discovering the actual authoritative transport and authority requirements for each object.

A conversation card should answer:

`what is this? · where does it live? · who/what is the subject? · who is speaking? · who executed it? · who can read it? · what activated it? · what did it produce?`

## Explore = universal object navigation

Current progressive surfaces:

- Feed
- Search
- Spaces
- Actors
- Mine
- source reader
- secondary Graph

Current structural coverage:

### BIThub

- topics/discussions
- category/space streams
- CORE catalog guides / definitions / activations
- Node catalog/definition distinction
- Actor registry: Constructs, MAS actors, personas, provider actors
- Mine activity/saved/notification/badge objects
- initial users/groups/tags/categories from federated search

### BITwiki

- pages/search/hydration
- categories
- templates
- Lua modules
- Property pages
- SMW per-subject facts
- Requested Knowledge fallback state

Next Explore priorities:

1. Verify current object families in production.
2. Add revisions/history, backlinks/links, SMW assertions, Cargo rows, and user namespaces/contributions where they provide real navigation value.
3. Add delegated private objects only when viewer authority permits.
4. Add runtime/workflow/evidence/research-job objects when real execution data exists.
5. Feed Knowledge Graph from the same normalized objects/provenance relations instead of maintaining a parallel semantic universe.

## Research = universal transformation mode

Research can already start from free intent or a normalized source object and supports:

- new page
- revision
- category/navigation
- semantic model
- Lua/computed projection
- reusable artifact
- coverage audit

Structural handoff rules now seed appropriate intent for Category / Property / Lua Module / ordinary Wiki page objects.

Next Research priority is **real execution**, not more planning UI:

`request -> preflight -> evidence -> guarded dispatch -> execution -> artifact/candidate -> review -> canonical knowledge`

Knowledge lifecycle and execution lifecycle remain separate.

## Identity / authority

Viewer state:

- Anonymous
- DiscourseConnect identity
- delegated User API Key authority
- future verified MediaWiki-linked identity

Authority rules remain:

- public reads: direct native APIs
- identity: DiscourseConnect
- private/user-scoped reads: delegated User API Key
- sensitive writes and cross-system mutation: guarded n8n path by default
- canonical BITwiki changes: source-controlled workflow unless explicitly replaced by governed runtime
- local runtime state: local until deliberate persistence

Do not expose write controls merely because an object semantically supports an action. Capabilities must be computed from current viewer authority/scopes.

## Immediate execution order

1. **Build and deploy verification**
   - rebuild current `main`
   - resolve any remaining compile/runtime errors
   - verify newest head is READY on production
   - smoke-test the new Actors / Mine / Wiki directory / entity-search / focused-Ask surfaces

2. **Private authority verification**
   - complete real DiscourseConnect callback
   - complete real User API Key approval
   - verify delegated PM / Construct / Chat reads

3. **Capability hardening**
   - derive per-object capabilities from actual authority/scopes
   - keep sensitive mutation hidden until authority + guarded path exist

4. **Real Deploy Research**
   - configure n8n broker
   - connect `research.deploy`
   - observe execution state and evidence
   - attach authoritative work trail

5. **Durable publication**
   - repair/choose Requested Knowledge runtime ownership
   - produce reviewable source-controlled BITwiki candidate changes
   - preserve full provenance into canonical knowledge

6. **Secondary expansion**
   - richer Wiki object graph
   - runtime objects / Node / MAS adapters from actual transports
   - Graph driven from the same object/provenance layer

## Verification gates

- Current `main` must be production-green before adding another feature layer.
- No private adapter is considered complete until verified with a real approved User API Key.
- No sensitive action is considered live until n8n guard/execute/verify succeeds end-to-end.
- No MediaWiki username match is treated as verified identity ownership until an explicit identity bridge exists.
- No CORE/Node/MAS output relation is invented without a stable execution/source identifier.

## UI invariants

- Ask / Research / Explore are first-class.
- Top-level navigation uses verbs/modes, never implementation systems.
- Origin is visible but not cognitively dominant.
- Progressive disclosure over dashboards.
- The front page remains sparse.
- Knowledge Graph is secondary Explore navigation.
- No command palette.
- No fake controls.
- No developer/configuration metalanguage on public surfaces.
- Real badges/activity/gamification are acceptable; invented decorative XP is not.
