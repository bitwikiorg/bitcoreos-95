# BITCOREOS-95 — TODO

Updated: 2026-08-21

## Active — M1 Resource hydration + readers

- [ ] Add normalized hydrated-resource types.
- [ ] Add BIThub topic hydration using public Discourse topic/post APIs.
- [ ] Add BITwiki page hydration using MediaWiki Action API.
- [ ] Add `/api/resource` hydration endpoint.
- [ ] Make Explorer hydrate the selected result and render source content internally.
- [ ] Make Ask ground from bounded hydrated source content, not only search snippets.
- [ ] Make Research planning use bounded hydrated source content.
- [ ] Verify production build and live Hub/Wiki hydration.

## Next — M2 Identity + delegated BIThub

- [ ] Configure `DISCOURSE_SSO_SECRET` and `SESSION_SECRET` in production.
- [ ] Verify DiscourseConnect login/callback against BIThub.
- [ ] Add scoped User API Key authorization flow.
- [ ] Add user-scoped notifications.
- [ ] Add bookmarks/tracked topics where scopes permit.
- [ ] Do not use a master admin key as the generic user authority path.

## Next — M3 Agent capability projection

- [ ] Add public agent-registry reader compatible with `agent.b8-plugin` registry semantics.
- [ ] Surface agent profile/resources in Explorer/Research.
- [ ] Map browser actions to canonical B8 capability names where applicable.

## Next — M4 Canonical Research state

- [ ] Query Cargo `Knowledge_requests`.
- [ ] Add request duplicate/existing-page preflight.
- [ ] Replace prototype `planned` knowledge state with Cargo lifecycle state.
- [ ] Keep n8n execution status separate from knowledge lifecycle status.

## Next — M5 n8n broker

- [ ] Define typed action envelope.
- [ ] Add correlation IDs and idempotency keys.
- [ ] Add signed/authenticated n8n request verification.
- [ ] Add action result/status endpoint or callback contract.
- [ ] Classify sensitive actions that must remain behind n8n policy guards.

## Later

- [ ] Real Deploy Research pipeline.
- [ ] SMW/Cargo-driven ontology graph.
- [ ] Cross-system provenance model.
- [ ] Source-controlled BITwiki candidate publication workflow.

## Repository rules

- Active development stays on `main`.
- Create branches only as intentional rollback/archive boundaries, never as routine feature branches.
- Preserve the sparse lander.
- No command palette.
- No fake UI controls.
- Backend capability work should not automatically add homepage complexity.
