# BITCOREOS-95 — TODO

Updated: 2026-08-21

## Completed — M1 Resource hydration + readers

- [x] Add normalized hydrated-resource types.
- [x] Add BIThub topic hydration using public Discourse topic/post APIs.
- [x] Add BITwiki page hydration using MediaWiki Action API.
- [x] Add `/api/resource` hydration endpoint.
- [x] Make Explorer hydrate selected resources internally.
- [x] Make Ask ground from bounded hydrated source content.
- [x] Make Research use bounded hydrated source content.
- [x] Verify live Hub/Wiki hydration.

## M2 — Identity + personal BIThub

Implemented:

- [x] Configure production `DISCOURSE_SSO_SECRET`.
- [x] Production auth reports configured.
- [x] Anonymous UI explicitly renders Anonymous / public-read state.
- [x] Add Sign in with BIThub actions.
- [x] Verify `/api/auth/login` redirects to BIThub DiscourseConnect provider.
- [x] Use canonical production callback URL.
- [x] Implement signed local BIThub identity session.
- [x] Implement scoped Discourse User API Key handshake.
- [x] Use RSA/OAEP for delegated key exchange.
- [x] Encrypt delegated credential cookies.
- [x] Add notifications projection.
- [x] Add bookmarks/tracking/watching projection.
- [x] Add public contribution trail and real contribution indicators.
- [x] Add provisional same-username MediaWiki User: namespace/contribution view.
- [x] Keep public identity separate from delegated authority.
- [x] Do not use a master admin key as the generic user authority path.

Verification remaining:

- [ ] Complete one real BIThub DiscourseConnect login/callback in a browser.
- [ ] Verify signed-in `/my` profile against that real session.
- [ ] Complete one real User API Key approval/callback.
- [ ] Verify Saved + inbox against real delegated state.

## Completed — M3 Agent capability projection

- [x] Read the public agent registry used by `agent.b8-plugin`.
- [x] Parse the live registry into typed agent resources.
- [x] Surface agents in Explore.
- [x] Reuse canonical B8 read/write capability names.
- [x] Distinguish registry identities from actual Discourse user accounts.

## M4 — Canonical Research state

Implemented:

- [x] Add research intent taxonomy for new page, revision, category/navigation, semantic model, Lua projection, reusable artifact, and coverage audit.
- [x] Add exact-page and overlapping-request preflight.
- [x] Separate knowledge lifecycle from execution lifecycle.
- [x] Attempt live Cargo `Knowledge_requests` first.
- [x] Fall back transparently to canonical `wiki-content` Requested Knowledge state when live Cargo fails.
- [x] Expose actual request-state source in the UI.
- [x] Include current target SMW facts in preflight when available.

Infrastructure remaining:

- [ ] Repair/deploy live Cargo `Knowledge_requests` table so Cargo can become runtime request-state authority.
- [ ] Verify lifecycle transitions against live Cargo after repair.

## Completed application layer — M5 n8n broker

- [x] Define typed action envelope.
- [x] Add correlation IDs and idempotency keys.
- [x] Add HMAC-signed n8n request contract.
- [x] Add server-side risk classification and allowlisted action vocabulary.
- [x] Keep sensitive/multi-system execution behind the broker.

Infrastructure remaining:

- [ ] Configure `N8N_ACTION_URL`.
- [ ] Configure `N8N_ACTION_SECRET`.
- [ ] Verify one guarded action round trip.
- [ ] Add/verify action-status reconciliation or callback once the real workflow endpoint is connected.

## Explore / navigation

- [x] Keep Feed and Search simple.
- [x] Add curated Spaces for Discussions, Nodes, Cores, Markets, Artifacts, Workspaces, Feeds, BITCOREOS.
- [x] Back Spaces with the real Discourse categories rather than duplicate state.
- [x] Add native category-stream adapter.
- [x] Open real category topics internally in Explore.
- [x] Keep Graph secondary to Ask / Research / Explore.
- [x] Add live SMW subject relations to BITwiki readers and Graph traversal.
- [ ] Continue replacing broad category topology with meaningful real cross-system semantic/provenance relations as those relations become authoritative.

## Personal workspace

- [x] Anonymous state.
- [x] BIThub sign-in entry point.
- [x] Public contribution trail.
- [x] Real metrics/contribution mix without invented XP.
- [x] Matching BITwiki User: namespace/contributions with explicit provisional identity semantics.
- [x] Saved work: bookmarks/tracking/watching.
- [x] Inbox: notifications.
- [ ] Add research requests/work trails to the personal projection once request ownership/provenance is authoritative.
- [ ] Add more game-like organization only when it reflects real participation/state; do not invent meaningless points.

## Next — M6 Real Deploy Research

- [ ] Connect guarded `research.deploy` to the real n8n workflow.
- [ ] Create/update the authoritative Requested Knowledge record.
- [ ] Create or attach a BIThub work trail.
- [ ] Select/dispatch B8-compatible agents or workflows.
- [ ] Observe execution state separately from knowledge lifecycle.
- [ ] Collect evidence/artifacts.
- [ ] Produce reviewable source-controlled BITwiki candidate changes.
- [ ] Preserve provenance from request -> work -> agent -> evidence -> candidate -> canonical page.

## Later — identity and provenance

- [ ] Choose the verified BIThub ↔ BITwiki identity bridge.
- [ ] Treat MediaWiki `User:` namespaces as authenticated user-owned surfaces only after that bridge exists.
- [ ] Add first-class cross-system provenance objects/relations.
- [ ] Add source-controlled BITwiki candidate publication workflow.

## Repository/UI rules

- Active development stays on `main`.
- Create branches only as intentional rollback/archive boundaries, never routine feature branches.
- Preserve the sparse lander.
- Ask / Research / Explore are first-class.
- Prefer progressive disclosure over information dashboards.
- No command palette.
- No fake UI controls.
- No developer/configuration metalanguage on public surfaces.
- Backend capability work should not automatically increase homepage complexity.
