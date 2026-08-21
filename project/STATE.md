# BITCOREOS-95 — Current State

Updated: 2026-08-21
Status: active functional build
Branch policy: active development occurs on `main`; archival branches are rollback snapshots only.

## Product role

BITCOREOS-95 is the low-friction navigation, research, and interaction client across BIThub and BITwiki.

It is not a new authority for Hub or Wiki data.

- BIThub / Discourse owns live work, discussion, users, messages, agent-facing work trails, and interaction state.
- BITwiki / MediaWiki owns durable knowledge. Semantic MediaWiki owns graph assertions; Cargo owns bounded operational records; the `wiki-content` repository owns source-controlled canonical wiki content.
- n8n is the privileged action and policy boundary for sensitive writes, multi-system transactions, guarded execution, retries, secrets, and jailbreak/prompt-injection-sensitive workflows.
- `bitwikiorg/agent.b8-plugin` is the canonical agent-facing BIThub capability family.
- BITCOREOS-95 owns retrieval, normalization, navigation, user-facing projections, session state, research UX, provenance display, and action routing.

## Authority model

### Public reads
Direct native APIs where possible:

- Discourse public APIs for BIThub.
- MediaWiki REST / Action API, then SMW/Cargo query surfaces where appropriate, for BITwiki.

Do not route harmless public reads through n8n merely for uniformity.

### Identity
DiscourseConnect SSO answers: **who is the user?**

BITCOREOS-95 may maintain its own signed session projection of the SSO identity, but Discourse remains the identity authority.

### Delegated BIThub authority
A Discourse User API Key or equivalent delegated user authority answers: **what may BITCOREOS-95 read or do as this user?**

Identity and delegated API authority are separate concerns.

### Mutations / privileged execution
Sensitive writes and multi-system actions route through n8n by default.

Canonical action flow:

`guard -> execute -> verify`

Actions should carry a `correlation_id` and `idempotency_key` so UI, n8n, BIThub, agents, and BITwiki work can be reconciled without duplicate execution.

## Current implemented surfaces

- Minimal Win95 / engineering-codex lander.
- Kordylewski Relay guide launcher.
- Federated public BIThub + BITwiki search.
- Explorer with normalized resource results and hydrated internal source reader.
- Ask workspace grounded with bounded hydrated Hub/Wiki source content.
- Research workspace that uses hydrated internal evidence to produce a preflight research packet.
- Ontology navigation graph.
- BIThub and BITwiki overview APIs.
- Generic `/api/resource` hydration endpoint.
- BIThub topic hydration, including bounded post-stream expansion.
- BITwiki page hydration using TextExtracts when available and rendered Action API parsing as fallback.
- DiscourseConnect SSO scaffold and signed BITCOREOS session logic.

## M1 verification

Completed: 2026-08-21
Implementation commits: `560d465`, `63e461e`

Verified in production:

- Next.js compile, lint/type validation, static generation, and deployment passed.
- Public BIThub topic hydration returns real post content and metadata.
- Public BITwiki page hydration returns real rendered page content, categories, revision metadata, and parser fallback when `extract` is empty.
- `/explorer` and `/api/resource` return HTTP 200 in production for verified resources.

## Current limitations

- Production SSO is scaffolded but not configured with `DISCOURSE_SSO_SECRET` and `SESSION_SECRET`.
- Delegated Discourse User API Key flow is not implemented.
- Agent registry is not surfaced in BITCOREOS-95.
- Cargo `Knowledge_requests` is not yet the Research state authority.
- n8n action broker is not yet implemented.
- Ontology is not yet driven by full SMW/Cargo semantic relationships.
- Cross-system provenance links are not yet first-class objects.
- BIThub hydration is intentionally bounded to protect the public reader from unbounded topic expansion.

## Active milestone

**M2 — Identity + delegated personal BIThub**

Immediate dependency: configure production DiscourseConnect/session secrets before live SSO can be verified.

Required outcome:

1. Verify production DiscourseConnect identity round trip.
2. Keep verified identity separate from delegated API authority.
3. Implement a scoped Discourse User API Key authorization flow.
4. Add user-scoped reads such as notifications/bookmarks/tracked resources only when delegated scope permits.
5. Keep sensitive/multi-system mutations behind n8n rather than turning the browser client into an admin proxy.

Parallel unblocked work while SSO secrets are unavailable: M3 public B8 agent-registry projection and M4 read-only Cargo `Knowledge_requests` discovery.

## UI invariants

- Win95/BITCOREOS-95 styling exists to reduce cognitive load, not simulate an operating system for its own sake.
- The front page stays a sparse lander.
- Complex dashboards belong only where they serve a task.
- No command palette.
- No fake minimize/maximize/close controls.
- No decorative controls without behavior.
- The ophanim / engineering-codex motif is a restrained recurring interface mark, not content lore.
