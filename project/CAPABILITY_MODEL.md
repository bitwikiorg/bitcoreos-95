# BITCOREOS-95 — Capability / Object Model

Updated: 2026-08-21
Status: canonical architecture reference

## Primary invariant

**Top-level surfaces are verbs/modes. Every object carries its own origin, identity, authority, state, capabilities, and provenance.**

BITCOREOS-95 is the unified interface. BIThub and BITwiki are not competing destinations in the navigation; they are authoritative state planes underneath the objects a user is working with.

Primary surfaces remain:

- **Ask** — converse, invoke, continue, interpret.
- **Research** — investigate, transform, distill, review, crystallize.
- **Explore** — find, browse, inspect, traverse.

Identity is ambient/contextual, not a fourth product mode. The identity control may open a personal projection, but conversations stay in Ask and knowledge/work objects stay reachable from any surface.

## Recursive context capsule

Every object projected by BITCOREOS should be representable by a common envelope:

```text
Object
├── id + kind
├── origin
│   ├── plane: hub | wiki | local | workflow
│   ├── transport/API
│   └── canonical ref/URL
├── identity
│   ├── current human
│   ├── participants
│   └── executing identity: Construct | CORE | Node | MAS | agent | local model
├── authority
│   ├── public
│   ├── SSO identity
│   ├── delegated user scopes
│   ├── n8n policy
│   └── privileged/admin when explicitly applicable
├── state
│   ├── read/unread
│   ├── watched/tracked/starred/bookmarked
│   ├── lifecycle/execution state
│   └── version/revision
├── provenance
│   ├── replies-to / parent
│   ├── invokes / activates
│   ├── derived-from
│   ├── requested-by
│   ├── executed-by
│   ├── produces
│   ├── revises
│   └── canonicalizes
└── capabilities
    ├── read / reply / send
    ├── ask / research / explore
    ├── activate / dispatch
    ├── bookmark / watch / track / star
    ├── edit / propose / review
    └── share / export where supported
```

The UI should normally collapse this to a few human-readable chips, e.g. `Aletheia · Construct · PM · private`, `Fractal CORE · workflow run · topic`, or `BITwiki page · canonical`. Full provenance belongs behind an inspect disclosure.

## Ask — unified conversation/workcell surface

Ask is the single place for conversational interaction. Conversation history is an aggregate/index over authoritative transports; BITCOREOS should not pretend all conversations are locally owned chats.

### Conversation transports available from the current reference APIs

1. **Local BITCOREOS grounded AI**
   - Current `/api/ask` + AI Gateway.
   - Browser-local conversation history is a local transport, not BIThub truth.

2. **Discourse Personal Messages**
   - PMs are private-message topics.
   - Read incoming/sent PM topic lists.
   - Read full topic/post streams.
   - Create PM / reply to PM with delegated write authority or guarded execution.

3. **Discourse AI conversations / Constructs**
   - Current Discourse AI exposes `/discourse-ai/ai-bot/conversations`.
   - Conversations are PM-backed topics to bot users.
   - `target_username` chooses the bot identity.
   - optional `ai_agent_id` chooses an allowed AI agent/persona.
   - conversations can be listed, created and starred; streaming responses can be retried/stopped.
   - therefore `Construct in PM` is a real native conversation kind.

4. **Discourse Chat**
   - distinct from PM topics.
   - current-user channels and threads.
   - direct-message channels.
   - channel messages and thread messages.
   - channel/thread read state, drafts, notification settings, memberships, pins, search, invites and archives.
   - message create/edit/delete/restore, interactions and flags where authorized.

5. **CORE run**
   - not an ordinary content category and not semantically a chatbot.
   - a CORE topic/post acts as a workflow activator; the first post starts a staged workflow and outputs accumulate in the thread.
   - completed thread can become reusable Core Seed/context.
   - Ask may render the thread conversationally, but its identity must remain `CORE run` / workflow execution.

6. **Node run**
   - focused task/agent workflow terminal represented through BIThub topics and agent-facing execution.
   - Ask may continue or inspect a run while preserving Node identity/provenance.

7. **MAS workcell / MAS-Factory session**
   - persistent topic/workcell with one goal, context, participants, execution trace and memory surface.
   - may include humans, Constructs, agents and tools.

8. **Public topic/discussion**
   - any normal topic can be opened as conversational context and replied to when authority permits.

9. **Workspace/tool session**
   - app-like BIThub workflow/tool surfaces may expose conversation or action affordances depending on the underlying implementation.

10. **External/n8n agent session**
    - optional adapter for guarded external workflows; must identify itself as workflow/external rather than impersonating a native Discourse conversation.

### Ask history presentation

History should be grouped by meaning/identity rather than by storage engine. Example rows:

- `Aletheia · Construct · PM`
- `@agent-x · Direct message · Chat`
- `Fractal CORE · CORE run · topic`
- `Research cell #62442 · MAS · private topic`
- `Local Guide · AI Gateway`

Opening any row resolves its adapter and authority, then reads the authoritative transcript/thread.

## Explore — universal object browser

Explore should not begin by asking `Hub or Wiki?`. Use object families first; origin is a facet/chip.

Recommended object-family filters:

- **Knowledge**
- **Discussions**
- **Automations**
- **People + Agents**
- **Exchange**
- **Activity**

### BIThub / Discourse objects

Core forum/social objects:
- topic
- post
- category
- tag
- user
- group
- private-message topic
- notification
- user action/activity
- bookmark + reminder + pin
- draft
- tracked/watched topic/category
- badge
- poll
- event/calendar object when enabled
- upload/file
- invite

Chat objects:
- channel
- direct-message channel
- thread
- message
- membership
- pin
- chat draft
- notification/read state

Discourse AI objects when enabled:
- AI conversation
- AI agent/persona identity
- AI artifact + artifact version
- AI artifact key/value state
- shared AI conversation
- topic/chat summary
- AI helper suggestion
- semantic/quick-search result

BIThub semantic/runtime object kinds:
- Construct
- Persona
- Agent
- Agentic Construct
- CORE definition/run
- Core Seed
- Node definition/run
- Workspace
- MAS workcell
- Artifact
- Marketplace listing
- Feed item
- Guide / Lab / Publication / RFC / BIP / Changelog / Resource / Support item
- BITCOREOS workflow output/log/result

These semantic kinds may be stored as ordinary Discourse topics/posts/categories. The app must preserve both layers: `kind=CORE run`, `origin=Discourse topic`.

### BITwiki / MediaWiki objects

- page
- section/body
- revision/history entry
- redirect
- category
- link/backlink
- namespace
- user namespace
- user contribution
- file/image
- template
- `Module:` / Lua module
- `Property:` / SMW property page
- Concept
- semantic subject
- semantic assertion/relation/inverse relation
- SMW query + query result
- Cargo table
- Cargo field
- Cargo row/record
- Requested Knowledge record
- `Form:` / Page Forms form
- recent change

Current API families:
- MediaWiki REST / Action API
- Semantic MediaWiki `ask` / `askargs` and subject browsing
- Cargo `cargoquery`, `cargotables`, `cargofields`
- Scribunto/Lua with `mw.ext.cargo` / semantic integrations where deployed
- Page Forms structured workflows, including API surfaces such as `pfautoedit` where policy permits

## Research — transformation surface

Research accepts any context capsule or set of capsules from Ask/Explore/identity and determines the correct durable transformation.

Canonical target classes:

- new BITwiki page
- revision to existing page
- category/navigation change
- SMW property/schema/model change
- Concept/query definition
- Lua/computed projection
- template or Page Form improvement
- Cargo operational schema/record workflow
- reusable BIThub Artifact
- evidence ledger
- coverage audit / request set
- BIThub research/work trail
- review candidate

Research must distinguish **knowledge lifecycle** from **execution lifecycle** and preserve provenance from request → workcell/agents → evidence → candidate → canonical output.

## Identity — ambient recursive state

Identity appears in every surface:

- human/session identity from DiscourseConnect
- object author/owner/participants
- execution identity (Construct/CORE/Node/MAS/agent/model)
- delegated authority/scopes
- provisional or verified BITwiki identity mapping

The personal identity projection may contain:
- trust level and groups
- contribution trail
- notifications
- bookmarks/reminders/pins
- watched/tracked state
- drafts
- real badges
- user status
- BITwiki User namespace/contributions
- owned/requested research work
- recent conversation shortcuts that open in Ask

Do not build a second chat transcript UI inside the personal projection.

## Authority / action classes

Do not conflate identity with permission.

1. `public-read` — direct public native APIs.
2. `delegated-read` — User API Key `read` / `session_info` / notifications etc.
3. `user-write` — normal user-intended reply/message/bookmark/watch actions; only after deliberate delegated authority and server-side route allowlisting.
4. `ai-invoke` — Construct/model invocation; may require user authority and policy/rate controls.
5. `workflow-activate` — CORE/Node/MAS/agent execution; route through guarded execution when sensitive or multi-system.
6. `canonical-change` — proposed durable BITwiki changes; source-controlled validation/review workflow.
7. `privileged-admin` — administrative APIs; never surface as generic user capability.

n8n remains the privileged policy/action broker for sensitive requests, jailbreak/prompt-injection-sensitive execution, secrets, cross-system transactions, retries and verification. Harmless reads should remain direct.

## Reference hierarchy

For Discourse capability discovery:
1. current `discourse/discourse` routes/controllers and enabled first-party plugins;
2. generated `discourse/discourse_api_docs` OpenAPI;
3. `discourse/discourse_api` Ruby client as a useful convenience reference, but not exhaustive for newer Chat/AI capabilities.

For BIThub semantics, live BIThub canonical category guides/glossaries and `bitwikiorg/agent.b8-plugin` define system-specific meaning on top of generic Discourse storage.

For BITwiki, MediaWiki/SMW/Cargo/Page Forms/Scribunto native APIs plus `wiki-content` define the authoritative knowledge and semantic layers.

## UI invariant

Complexity belongs in the object model, not on the screen by default. Show the smallest useful projection, then progressively disclose origin, identity, authority, state, capabilities and provenance when the user asks for them.