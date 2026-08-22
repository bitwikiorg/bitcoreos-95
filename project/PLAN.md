# BITCOREOS-95 — Canonical Plan

Updated: 2026-08-21

## Product identity

BITCOREOS-95 is the unified interaction projection of BIThub + BITwiki. The user should not have to think of the shell, BIThub, and BITwiki as separate products.

Authoritative state still remains where it belongs:

- Discourse / BIThub: live discussion, PMs, Chat, users, groups, categories, tags, notifications, interaction state, bot/agent work trails.
- MediaWiki / BITwiki: durable pages, revisions, categories, semantic assertions, user namespaces, and canonical knowledge.
- Cargo: bounded operational records when deployed and healthy.
- n8n: guarded privileged execution, sensitive writes, secrets, retries, and multi-system transactions.
- local runtimes / MAS factories: ephemeral execution and conversation state until deliberately persisted elsewhere.

## First-class grammar: verbs, not systems

The top-level product grammar is intentionally small:

- **Ask** — converse with any supported conversational object or runtime.
- **Research** — turn any object, question, gap, or conversation into structured knowledge work.
- **Explore** — find and navigate any object in the ecosystem.

The lander remains sparse orientation.

Identity is global shell state, not a competing top-level destination. "Mine" is a filter/projection available inside every mode.

Knowledge Graph is a secondary Explore projection, not a first-class app.

## Recursive object model

Every object shown anywhere in BITCOREOS-95 must carry the same contextual envelope:

- `id` — stable local normalized ID plus authoritative source ID.
- `kind` — what the object is.
- `origin` — hub, wiki, local runtime, n8n, external adapter.
- `substrate` — topic, post, PM, chat channel, chat DM, chat thread, chat message, CORE activation, Construct, Node, agent, wiki page, SMW subject, Property, category, Cargo record, artifact, workflow, research request, local conversation, MAS run, etc.
- `identity` — actor/owner/participants plus current viewer identity.
- `authority` — public/private/group/local visibility, required auth, delegated scopes, mutation path.
- `provenance` — source URL/ID, parent object, derived-from, produced-by, canonicalizes/revises/projects relations, timestamps.
- `state` — unread/read, tracked/watched/bookmarked, lifecycle/execution state where applicable.
- `capabilities` — actions actually allowed for this object and current authority.

This envelope is recursive: a user can own conversations; a conversation can activate a CORE; a CORE activation can produce an artifact; an artifact can support a research request; a research request can revise a wiki page; the page can expose SMW relations back to all of those objects.

## Ask = universal conversation mode

Ask is not only a local AI chat.

Supported conversation substrates should converge into one conversation UI while retaining explicit source badges and authority:

1. **Local Ask** — ephemeral/local model conversation grounded in Hub/Wiki evidence.
2. **Discourse PM** — private-message topic, including AI/bot PMs.
3. **Discourse Chat channel** — short-form channel conversation.
4. **Discourse Chat DM** — direct-message channel.
5. **Discourse Chat thread** — threaded chat conversation.
6. **CORE activation** — an ordinary topic/post/reply trail used as an activator and execution conversation for a CORE.
7. **Construct / bot conversation** — PM, Chat DM, topic, or other authoritative substrate involving a registered Construct/agent.
8. **Node interaction** — task-specific interaction with provenance to its workflow/runtime.
9. **Local MAS factory/session** — local multi-agent conversation/run, optionally persisted into Hub/Wiki later.
10. **n8n-mediated workflow conversation/status** — execution events projected conversationally where useful, without pretending n8n is the canonical discussion store.

A conversation card must answer immediately:

`what is this? · where does it live? · who is speaking? · who can read it? · what activated it? · what did it produce?`

### CORE semantics

A CORE is a workflow/cognition capability and activator, not merely a category.

The Discourse Cores category may be used to discover definitions and existing activations, but the semantic object is the CORE plus its activations/output trail.

An activation may use normal Discourse topics/posts/replies. In Ask it appears as a conversation with `substrate=core_activation`; in Explore the same underlying objects can appear as CORE definitions, activations, topics, or outputs; in Research the CORE can be selected as an executor.

## Explore = universal object navigation

Explore should navigate both live-work and durable-knowledge objects without making the user choose a product first.

Primary object families:

### Discourse / BIThub

- topics
- posts/replies
- private-message topics
- users
- groups/memberships
- categories/subcategories
- tags
- search results
- user activity/actions
- notifications
- bookmarks
- tracked/watched topics and read state
- badges / real gamification state
- polls
- uploads/attachments
- drafts where delegated APIs permit
- native Chat channels
- native Chat direct-message channels
- Chat messages
- Chat threads
- Chat drafts
- Chat pins
- Chat memberships
- Chat reactions/interactions
- Chat search/read state/notification settings
- CORE definitions + activations
- Nodes
- Constructs/agents
- artifacts
- workspaces
- feeds
- markets/marketplace surfaces

### MediaWiki / BITwiki

- pages
- sections
- revisions/history
- categories
- templates
- Lua modules
- SMW subjects
- SMW Properties and assertions
- semantic query results
- Concepts when actually deployed
- Cargo tables/rows
- backlinks/links
- user namespaces
- user contributions
- requested-knowledge records
- provenance links to Hub work, agents, artifacts, and research runs

### Runtime / execution

- research requests
- workflow runs
- local MAS sessions
- n8n jobs/status
- evidence packets
- candidate drafts/artifacts

"Hub" and "Wiki" remain filters/origin facets, not top-level conceptual silos.

## Research = universal transformation mode

Research can start from:

- free user intent
- an Ask conversation
- a PM or Chat thread
- a CORE activation
- a Construct/Node interaction
- a Hub topic/post
- a Wiki page/section/category
- an SMW subject/property gap
- a Cargo request
- an artifact
- a local MAS run
- a coverage audit

Research must decide what durable output is actually needed:

- new BITwiki page
- revision to existing page
- new/changed category/navigation
- SMW Property/schema/assertion work
- Lua/template/computed projection
- reusable artifact
- requested-knowledge record/set
- evidence/provenance repair
- no new page because existing knowledge already satisfies the intent

Knowledge lifecycle and execution lifecycle remain separate.

## Identity is recursive and global

The shell always has a current viewer identity:

- Anonymous
- verified Discourse user via DiscourseConnect
- delegated Discourse authority via User API Key
- future verified MediaWiki-linked identity

Every object also exposes its own actor identity:

- human user
- bot
- Construct
- CORE
- Node
- agent/MAS
- system/runtime

Personal organization is a lens, not another product:

- Ask → My conversations / unread / bots / CORE activations / local sessions
- Research → My requests / reviews / executions / outputs
- Explore → My posts / replies / saved / watched / notifications / wiki edits / user namespace / badges / contributions

Clicking the global identity control may open a denser profile/workspace drawer, but it must not duplicate the three primary modes.

## Authority model

- Public reads: direct native APIs.
- Identity: DiscourseConnect SSO.
- Private/user-scoped reads: delegated Discourse User API Key.
- Sensitive writes and multi-system mutations: n8n by default.
- Canonical BITwiki knowledge writes: source-controlled `wiki-content` workflow unless an explicitly governed runtime path replaces it.
- Local runtime state remains local until a deliberate persistence action creates an authoritative Hub/Wiki object.

## Provenance relations

Canonical relation vocabulary should include at minimum:

- `authored-by`
- `participant-in`
- `reply-to`
- `thread-of`
- `activates`
- `executed-by`
- `produces`
- `derived-from`
- `references`
- `discusses`
- `requests`
- `reviews`
- `revises`
- `canonicalizes`
- `projects`
- `belongs-to`

## Current implementation priority

1. Introduce the shared recursive object/context envelope.
2. Refactor Ask into a universal conversation browser/runtime.
3. Add PM conversation reads and native Discourse Chat adapters using delegated authority.
4. Represent CORE definitions and activations correctly; stop treating the Cores category as the semantic object.
5. Move personal data into global identity/Mine projections rather than a duplicate chat/product surface.
6. Refactor Explore around object families + facets, retaining origin/authority/provenance on every row.
7. Make Research accept any normalized object as its source context.
8. Continue n8n guarded execution and real Deploy Research after the interaction model is coherent.

## UI invariants

- Ask / Research / Explore are first-class.
- Top-level navigation uses verbs/modes, never implementation systems.
- Origin is always visible but not cognitively dominant.
- Progressive disclosure over dashboards.
- The front page remains sparse.
- Knowledge Graph is secondary Explore navigation.
- No command palette.
- No fake controls.
- No developer/configuration metalanguage on public surfaces.
- Gamification may use real Discourse badges/gamification/activity state, but never invented decorative XP detached from authoritative behavior.
