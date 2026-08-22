# BITCOREOS-95 — Authoritative API Surfaces

Updated: 2026-08-21

Purpose: map real platform capabilities into the three product verbs without turning implementation APIs into navigation silos.

## Product rule

**Ask · Research · Explore** are the primary modes.

Discourse, MediaWiki, SMW, Cargo, n8n, local runtimes, COREs, Constructs, Nodes, and MAS are authoritative substrates/executors behind objects. Every projected object carries its own `ContextCapsule` with origin, substrate, identity, authority, visibility, provenance, state, and capabilities.

`Mine` is a viewer-relative lens. It is not a fourth product.

---

## Discourse / live interaction plane

### Forum topics + posts

Authoritative objects:

- public topics
- public posts/replies
- category topics
- private-message topics
- private-message posts/replies
- topic participants
- topic read/unread/tracking state
- polls and topic-level interaction metadata where enabled
- uploads/attachments referenced by posts

Primary APIs/patterns:

- `/latest.json`
- `/top.json`
- `/categories.json`
- `/c/:slug/:id.json`
- `/t/:id.json`
- `/posts/:id.json`
- `/search.json`
- `/topics/private-messages/:username.json`
- `/topics/private-messages-sent/:username.json`
- `/posts` for topic/post/PM creation when authorized

Product placement:

- **Ask:** PM conversations, Construct PMs, CORE activation topic/reply trails, other topic-shaped conversational work.
- **Research:** any topic/post may become source context or evidence.
- **Explore:** topics/posts/categories/search results as navigable objects.

Authority:

- public topics/posts: direct public reads.
- PMs: verified identity + delegated user authority.
- writes: use the narrowest legitimate user authority; sensitive/cross-system writes remain guarded through n8n.

### COREs

CORE is a workflow/cognition capability, **not a category**.

Current Discourse representation may use the Cores category as:

1. a catalog of CORE definitions; and
2. an index of normal topic/post/reply trails that activate/run COREs.

Product placement:

- **Ask:** activation run as conversation.
- **Research:** CORE can be source context or executor candidate.
- **Explore:** CORE definition, activation, outputs, and provenance.

Required distinction:

`CORE definition != CORE activation topic != output artifact`

### Private messages

Classic Discourse PMs are topic-archetype conversations, separate from native Chat DMs.

Primary API patterns:

- `/topics/private-messages/:username.json`
- `/topics/private-messages-sent/:username.json`
- `/t/:topicId.json`
- create/reply through post APIs when authorized.

Product placement:

- **Ask:** conversation transcript.
- **Research:** distill a PM/Construct interaction when user chooses.
- **Explore:** private objects only under Mine/authorized filters when useful.

### Native Discourse Chat

Chat is a separate first-party interaction substrate from forum topics/PMs.

Audited first-party surfaces include:

- public/chatable channels
- direct-message channels
- messages
- threads
- current-user channel memberships
- current-user threads
- search
- read state
- notification settings
- pins
- reactions/interactions
- drafts
- channel membership/invites

Representative paths include:

- `/chat/api/me/channels`
- `/chat/api/me/threads`
- `/chat/api/channels/:channelId/messages`
- `/chat/api/channels/:channelId/threads/:threadId/messages`
- direct-message channel endpoints under the Chat API

Semantic authority:

- public Chat channel: public conversational object, even if discovery/read API still requires an authenticated viewer in a given deployment.
- Chat DM: private conversation.
- Chat thread: child conversation of a channel with `thread-of` provenance.

Product placement:

- **Ask:** primary interaction/transcript surface.
- **Research:** any channel/DM/thread may be distilled when authority permits.
- **Explore:** channel/thread objects may be navigated when that improves discovery; interaction stays in Ask.

Do not conflate:

`public Chat channel != Chat DM != classic PM != forum topic`

### Discourse AI / Constructs

First-party Discourse AI surfaces include AI-bot/agent conversations and related AI resources.

Observed route families include:

- `/discourse-ai/ai-bot/conversations`
- AI bot/agent conversation operations
- AI artifacts/shared conversations
- semantic/quick search
- summarization/AI helper surfaces

BIThub convention:

- Constructs are commonly interacted with through private AI conversations/PMs.
- the Construct identity/executor is distinct from the PM transport.

Product placement:

- **Ask:** `Construct · PM` or whatever authoritative transport actually hosts the interaction.
- **Research:** Construct conversation/output can become source context.
- **Explore:** Construct/agent identity, registry entry, capabilities, outputs.

### Nodes

Node is a focused task interaction/capability.

A Node may use a topic, PM, app/workspace, n8n workflow, or other runtime underneath. The normalized object must preserve the actual substrate rather than assuming one transport.

Product placement:

- **Ask:** conversational Node interactions.
- **Research:** Node as executor/source.
- **Explore:** Node definitions, available inputs, outputs, provenance.

### MAS / workcells

MAS sessions may be topic-backed, PM-backed, local-runtime, or workflow-backed.

Product placement:

- **Ask:** conversational/session projection.
- **Research:** source context or executor.
- **Explore:** run topology, agents, outputs, provenance.

Local MAS state remains local until deliberately persisted into an authoritative Hub/Wiki/workflow object.

---

## Discourse identity + Mine plane

### Identity

- DiscourseConnect: verifies **who the viewer is**.
- BITCOREOS signed session: local projection of verified identity.
- Discourse User API Key: delegates **what BITCOREOS may read/do as that viewer**.

Do not collapse identity and delegated authority.

### User/profile objects

Useful first-party reads include:

- `/u/:username.json`
- user activity/actions
- topics started
- replies/posts
- trust level and profile statistics
- groups/memberships where visible
- user directory/profile metadata

Product placement:

- global identity context
- **Explore → Mine:** contributions/activity
- **Research → Mine:** requests/reviews/outputs as those authoritative relations become available
- **Ask → Mine:** private conversations/unread/bots/runs.

### Notifications

- `/notifications.json`
- notification totals/read operations where delegated scope permits

Mine signal; may deep-link to the relevant Ask/Explore/Research object instead of becoming its own application.

### Bookmarks / tracked / watched / read state

Viewer-relative state that should annotate the same underlying object.

Do not clone bookmarked topics into a new canonical store.

### Badges / real gamification

Discourse exposes authoritative user badges through `UserBadgesController`, including the public user badge projection:

- `/user-badges/:username.json`

Badge data includes granted badges, badge definitions/types, grant timestamps, favorites/grouping where available.

Use badges together with real signals such as:

- trust level
- likes received/given
- topics/replies
- visit/activity state
- actual completed work/provenance later

This is the allowed gamification substrate. Do **not** invent decorative XP unrelated to real behavior.

### Drafts

Discourse and native Chat both expose draft concepts. Drafts are viewer-private mutable state and should only be projected if there is a concrete workflow benefit.

Do not prioritize drafts ahead of conversation/read/navigation fundamentals.

---

## Realtime plane

Discourse MessageBus provides realtime event transport for appropriate authenticated experiences.

Potential uses:

- new conversation messages
- notification updates
- topic/post updates
- Chat updates
- workflow status projections where bridged

Realtime is an enhancement to authoritative objects, not another source of truth.

Do not add MessageBus complexity until normal read/write paths are correct.

---

## B8 / agent capability plane

`bitwikiorg/agent.b8-plugin` is the canonical agent-facing BIThub capability family.

Current core vocabulary includes reads such as:

- `b8_get_topic`
- `b8_get_post`
- `b8_list_agents`
- `b8_watch_topic`

and writes/interactions such as:

- `b8_create_topic`
- `b8_deploy_core`
- `b8_reply_to_topic`
- `b8_send_private_message`
- `b8_send_chat_message`

Rule:

- public reads should not require a user key merely for uniformity.
- user-scoped writes need legitimate delegated/user authority or the guarded workflow path.

B8 is a capability vocabulary/adaptor family, not another UI product.

---

## MediaWiki / durable knowledge plane

### Core page API

Objects/surfaces:

- pages
- sections
- revisions/history
- links/backlinks
- categories
- templates
- modules
- users/User namespaces
- user contributions
- search

Primary APIs:

- MediaWiki Action API `/w/api.php`
- REST search/page routes under `/w/rest.php`

Product placement:

- **Explore:** primary durable-knowledge navigation.
- **Ask:** evidence/grounding and object discussion.
- **Research:** target, source context, revision candidate, or output destination.

### Semantic MediaWiki

Objects:

- semantic subjects
- Properties
- assertions/property values
- inverse relations
- semantic query results
- Concepts where actually deployed

Current BITCOREOS path:

- `smwbrowse`
- per-subject semantic traversal

Product placement:

- **Explore:** semantic relationships and secondary Knowledge Graph.
- **Research:** detect missing/weak schema, model Properties/assertions, inform page/revision work.
- **Ask:** semantic facts may ground explanations where relevant.

### Cargo

Operational structured records, not general canonical prose.

Important target:

- `Knowledge_requests`

Knowledge lifecycle:

`requested -> researching -> drafting -> review -> satisfied | declined`

Execution lifecycle is separate.

Live BITwiki currently requires repair/deployment of `Knowledge_requests`; source-controlled fallback is used until the runtime table is healthy.

### User namespaces

`User:<identity>` can become a durable user-owned knowledge surface once the BIThub ↔ BITwiki identity bridge is verified.

Until then, same-username matching is only a projection/hint, not proof of account ownership.

---

## n8n / guarded execution plane

n8n owns privileged or sensitive orchestration where appropriate:

- cross-system writes
- secret-bearing workflows
- guarded agent dispatch
- prompt-injection/jailbreak-sensitive actions
- retries and verification
- multi-step publication pipelines
- external/private integrations

Current BITCOREOS action envelope includes:

- action
- actor
- target
- payload
- source context
- correlation ID
- idempotency key
- risk class
- timestamp

Canonical flow:

`guard -> execute -> verify`

n8n should not proxy harmless public reads merely for architectural uniformity.

---

## Product capability matrix

| Capability/object | Ask | Research | Explore | Mine/identity | Default authority |
|---|---|---|---|---|---|
| Local grounded AI conversation | primary | source | — | local history | local / AI invoke |
| Public forum topic/post | conversational when appropriate | source | primary | authored/saved lens | public read |
| Classic PM | primary | source | authorized navigation | unread/private lens | delegated private |
| Construct conversation | primary | source/executor output | Construct identity | bot/private lens | delegated private |
| Public Chat channel | primary | source | optional navigation | membership/unread lens | public semantic visibility; deployment auth may gate API |
| Chat DM | primary | source | authorized navigation | unread/private lens | delegated private |
| Chat thread | primary | source | optional navigation | unread lens | inherits channel authority |
| CORE definition | select/context | executor candidate | primary | used/recent lens later | public read |
| CORE activation/run | primary conversation | source/execution | navigation/provenance | Mine runs later | usually public topic read |
| Node | interaction | executor/source | definition/navigation | Mine runs later | substrate-dependent |
| MAS session | interaction | source/executor | runtime navigation | Mine sessions | runtime-dependent |
| User/profile | — | actor/provenance | primary | global identity | public/delegated |
| Badge/trust/activity | — | provenance signal | user inspection | primary signal | public profile where allowed |
| Notification | deep-link | deep-link | deep-link | primary lens | delegated |
| Bookmark/watch/track | annotate object | annotate source | annotate object | primary lens | delegated |
| Wiki page/revision | grounding | source/target/output | primary | contributions lens | public read |
| SMW subject/Property | grounding | source/target/schema | semantic navigation | contribution later | public read |
| Cargo request | context | primary lifecycle | navigation | Mine requests later | public/runtime-dependent |
| n8n job/workflow | status projection | execution | runtime object | Mine jobs later | guarded |

---

## Implementation priority

1. Make object/context envelope universal across current rows/readers.
2. Verify SSO callback and delegated User API Key round trip.
3. Verify PM/Construct/Chat adapters against the real signed-in account.
4. Finish useful Mine signals with authoritative badges/trust/activity.
5. Add low-density object-family/facet navigation to Explore.
6. Add correct write paths to Ask: PM reply, Chat send, CORE activation, with authority/risk routing.
7. Add Mine filters inside Ask/Research/Explore rather than growing a separate dashboard.
8. Connect real `research.deploy` through n8n and preserve provenance through durable BITwiki output.
9. Add realtime only after normal interaction paths are correct.

## Reference repositories audited

- `discourse/discourse`
- `discourse/discourse-ask-theme`
- `discourse/discourse-chat-integration`
- `discourse/discourse-just-chat`
- `discourse/discourse_api`
- `discourse/discourse_api_docs`
- `bitwikiorg/agent.b8-plugin`

Theme/integration repositories can inform UX and integration patterns, but canonical object authority remains the underlying Discourse/MediaWiki/runtime objects.
