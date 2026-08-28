# Internal linking execution plan

Status: implementation plan only. `PLANNED` URLs do not exist and must not be linked from public pages until published.

## Operating rules

- Add a link only where the surrounding paragraph makes the target useful to the reader.
- Use one commercial link to `/copywriting/` only when the article reaches a writing-service context; do not add it just because a URL is informational.
- Vary anchors. Do not repeat exact-match anchors site-wide.
- Treat each planned URL as unavailable until its article and generated HTML exist.
- Re-evaluate links in the 2–4 week GSC review: update, expand, link, publish or do nothing.
- Refresh articles only after factual change, a material query gap, striking-distance opportunity, meaningful internal-link change or a clear information gap. Never change dates artificially or add text to inflate word count.

## URL inventory

| URL | Role | Status |
|---|---|---|
| `/` | Brand and engineering positioning | CURRENT |
| `/copywriting/` | Commercial technical-writing page | CURRENT |
| `/articles/` | Editorial hub | CURRENT |
| `/articles/ai-agents-for-customer-support/` | Support-agent implementation | CURRENT |
| `/articles/ai-agents-vs-traditional-automation/` | Agent/workflow comparison | CURRENT |
| `/articles/crm-automation-7-workflows/` | CRM workflow patterns | CURRENT |
| `/articles/eu-ai-act-ai-agents-2026/` | AI regulation authority | CURRENT |
| `/articles/what-is-saas-automation/` | Automation/integration hub candidate | CURRENT |
| `/rafaops/` | Operational evidence | CURRENT |
| `/projects/portfolio-automation/` | Automation infrastructure evidence | CURRENT |
| `/articles/ai-agent-observability/` | Production telemetry | PLANNED — P0-01 |
| `/articles/ai-agent-guardrails/` | Tool permissions and controls | PLANNED — P0-02 |
| `/articles/n8n-in-production/` | Workflow reliability | PLANNED — P0-03 |
| `/articles/ai-agents-in-production/` | Cluster hub | FUTURE PILLAR — do not create yet |

## Existing article execution map

### `/articles/ai-agents-for-customer-support/`

→ `/articles/crm-automation-7-workflows/`
Suggested anchor: `CRM automation`
Placement/context: existing section explaining the CRM as customer context.
Reason: connects customer-record ownership to the support use case.
Priority: KEEP.

→ `/articles/ai-agents-vs-traditional-automation/`
Suggested anchor: `the boundary between fixed workflows and reasoning agents`
Placement/context: existing section on when agents are not the right fit.
Reason: direct decision-framework support.
Priority: KEEP.

→ `/articles/what-is-saas-automation/`
Suggested anchor: `the integration layer underneath the agent`
Placement/context: existing practical-start section.
Reason: explains CRM/helpdesk/API plumbing.
Priority: KEEP.

→ `/articles/ai-agent-guardrails/`
Suggested anchor: `tool permissions and safe escalation`
Placement/context: existing guardrails or human-handoff section.
Reason: deepens a concrete control already introduced.
Priority: ADD AFTER PUBLISH.

→ `/copywriting/`
Suggested anchor: `SEO content for products I actually build with`
Placement/context: current closing service sentence.
Reason: natural writing-service context.
Commercial link: NATURAL.
Priority: KEEP.

### `/articles/ai-agents-vs-traditional-automation/`

→ `/articles/what-is-saas-automation/`
Suggested anchor: `the deterministic plumbing`
Placement/context: existing complementary-layers section.
Reason: the target provides the integration foundation.
Priority: KEEP.

→ `/articles/ai-agents-for-customer-support/`
Suggested anchor: `how AI support agents work`
Placement/context: existing support example.
Reason: concrete implementation of the comparison.
Priority: KEEP.

→ `/articles/ai-agent-guardrails/`
Suggested anchor: `controls around a tool-using agent`
Placement/context: after the explanation of failure modes or the combined architecture.
Reason: adds practical constraints without changing the comparison's intent.
Priority: ADD AFTER PUBLISH.

→ `/articles/ai-agents-in-production/`
Suggested anchor: `the wider production architecture`
Placement/context: closing/related-resources section only.
Reason: future cluster hierarchy.
Priority: FUTURE PILLAR.

→ `/copywriting/`
Suggested anchor: `content about automation products`
Placement/context: current closing service sentence.
Reason: natural but secondary commercial connection.
Commercial link: OPTIONAL.
Priority: KEEP ONLY IF THE CURRENT CLOSING REMAINS EDITORIALLY USEFUL.

### `/articles/crm-automation-7-workflows/`

→ `/articles/what-is-saas-automation/`
Suggested anchor: `SaaS automation`
Placement/context: existing architecture/reliability framing.
Reason: parent concept for the workflow list.
Priority: KEEP.

→ `/articles/ai-agents-vs-traditional-automation/`
Suggested anchor: `when a workflow is a better choice than an agent`
Placement/context: existing automation strategy conclusion.
Reason: explains the boundary when CRM tasks involve unstructured input.
Priority: KEEP.

→ `/articles/n8n-in-production/`
Suggested anchor: `retries, duplicates and CRM workflow reliability`
Placement/context: existing reliability section.
Reason: target expands the operational gap behind the seven workflows.
Priority: ADD AFTER PUBLISH.

→ `/copywriting/`
Suggested anchor: `SEO content for CRM and automation software`
Placement/context: current service conclusion.
Reason: direct buyer/category fit.
Commercial link: NATURAL.
Priority: KEEP.

### `/articles/eu-ai-act-ai-agents-2026/`

→ `/articles/ai-agents-for-customer-support/`
Suggested anchor: `human handoff in a support-agent workflow`
Placement/context: existing handoff discussion.
Reason: concrete implementation counterpart.
Priority: KEEP.

→ `/articles/ai-agents-vs-traditional-automation/`
Suggested anchor: `when deterministic automation is the safer choice`
Placement/context: existing section on when not to use AI.
Reason: clarifies the engineering decision without giving legal advice.
Priority: KEEP.

→ `/articles/ai-agent-observability/`
Suggested anchor: `operational traces and agent observability`
Placement/context: logging/observability section.
Reason: distinguishes operational evidence from legal record-keeping.
Priority: ADD AFTER PUBLISH.

→ `/articles/ai-agent-guardrails/`
Suggested anchor: `engineering controls for production agents`
Placement/context: production/demo or pre-production checklist.
Reason: adds implementation controls while keeping legal claims separate.
Priority: ADD AFTER PUBLISH.

→ `/copywriting/`
Suggested anchor: `technical SEO content for AI products`
Placement/context: current final paragraph.
Reason: relevant only after the technical conclusion.
Commercial link: NATURAL.
Priority: KEEP.

### `/articles/what-is-saas-automation/`

→ `/articles/crm-automation-7-workflows/`
Suggested anchor: `practical CRM workflow examples`
Placement/context: existing CRM-as-hub and automation-first sections.
Reason: direct use-case support.
Priority: KEEP.

→ `/articles/ai-agents-vs-traditional-automation/`
Suggested anchor: `where AI fits after deterministic automation`
Placement/context: existing AI section.
Reason: correct comparison link, but reduce repeated uses to one contextual link.
Priority: UPDATE WHEN NEXT EDITED.

→ `/articles/n8n-in-production/`
Suggested anchor: `making SaaS automation reliable in production`
Placement/context: existing section on logging, duplication and hidden dependencies.
Reason: target directly resolves the operational concerns named in the article.
Priority: ADD AFTER PUBLISH.

→ `/projects/portfolio-automation/`
Suggested anchor: `a public automation infrastructure example`
Placement/context: existing real-example section.
Reason: turns the project into supporting engineering evidence.
Priority: ADD WHEN NEXT EDITED.

→ `/copywriting/`
Suggested anchor: `SEO content for products built on integrations`
Placement/context: current closing service sentence.
Reason: relevant but should remain one closing link.
Commercial link: NATURAL.
Priority: KEEP.

## Future P0 link map

### `/articles/ai-agent-observability/` — PLANNED

→ `/rafaops/` — `a public example of run evidence`; placement: after event-schema or evidence discussion; reason: real project context.
→ `/articles/eu-ai-act-ai-agents-2026/` — `logging versus regulatory record-keeping`; placement: privacy/retention section; reason: preserves legal/engineering distinction.
→ `/articles/ai-agents-for-customer-support/` — `human handoff in a support-agent workflow`; placement: outcome-state section; reason: a tangible use case.
→ `/articles/ai-agents-in-production/` — `monitoring and operating agents`; status: FUTURE PILLAR.
→ `/copywriting/` — `technical content for AI infrastructure products`; commercial link: OPTIONAL, conclusion only.

### `/articles/ai-agent-guardrails/` — PLANNED

→ `/articles/ai-agents-vs-traditional-automation/` — `the deterministic layer around an agent`; placement: introduction/control-boundary section.
→ `/articles/ai-agents-for-customer-support/` — `human handoff in support workflows`; placement: approval/handoff section.
→ `/articles/eu-ai-act-ai-agents-2026/` — `the AI Act context for production systems`; placement: legal-context section.
→ `/articles/ai-agent-observability/` — `the audit trail behind each control`; placement: auditability section.
→ `/copywriting/` — commercial link: DO NOT ADD in the article body.

### `/articles/n8n-in-production/` — PLANNED

→ `/articles/what-is-saas-automation/` — `the SaaS automation architecture behind a workflow`; placement: execution-path introduction.
→ `/articles/crm-automation-7-workflows/` — `CRM workflows that need reliable execution`; placement: duplicate/retry example.
→ `/projects/portfolio-automation/` — `a public automation infrastructure example`; placement: operational-evidence section.
→ `/rafaops/` — `operational evidence for automated runs`; placement: observability section.
→ `/copywriting/` — `technical content for automation products built on real integration constraints`; commercial link: NATURAL, conclusion only.

## Future pillar structure

`/articles/ai-agents-in-production/` is a **FUTURE PILLAR**. Do not create it until at least Observability, Guardrails, Architecture and Evaluation articles exist. Planned support:

```text
AI Agent Observability
AI Agent Guardrails
AI Agent Evaluation
AI Agent Cost Controls
AI Agent Architecture
        ↓
AI Agents in Production (future pillar)
```

The pillar should link down to each article and only link to `/copywriting/` when its reader is evaluating technical-content support. It must not become a link-only hub.
