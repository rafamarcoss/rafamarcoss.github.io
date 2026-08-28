# P0-01 content brief — AI Agent Observability

## Working title

`AI Agent Observability: What to Log in Production`

## Primary keyword

`AI agent observability`

## Secondary keywords

`AI agent monitoring`, `agent telemetry`, `LLM observability`, `AI agent tracing`, `production AI agents`, `AI agent logs`.

## Search intent

Informational with commercial-investigation overlap. The reader is usually evaluating how to operate an existing or planned agent, not looking for a basic definition of an agent.

## Target audience

AI engineers, platform/infrastructure engineers, technical founders and SaaS teams moving a tool-using agent from prototype to production.

## Reader problem

The team can see that an agent ran, but cannot reconstruct its inputs, allowed actions, tool failures, retries, handoffs, latency or cost. Logging everything is unsafe and expensive; logging too little prevents debugging.

## Search result expectations

The current SERP is vendor and engineering-guide led. Readers expect production framing, traces, evaluations, failure detection and practical controls—not a generic monitoring definition. [Vercel's guide](https://vercel.com/i/ai-agent-observability) and [JetBrains' architecture reference](https://www.jetbrains.com/pages/ai-agents/architecture/ai-agent-architecture/) show that architecture, runtime controls and technical depth are the baseline.

## Differentiation

Make the article a framework-neutral operational reference: trace the business workflow around the model, not just tokens and prompts. Its thesis is: **observability does not mean storing everything**. Explain the minimum event record that lets an operator answer what happened, why a boundary was triggered and whether a human needs to intervene.

## Information gain

- A concrete, redactable event schema separating identifiers, execution metadata, tool actions, policy decisions and outcome.
- A decision table for what to log, hash, redact or avoid collecting.
- A failure-to-field mapping: duplicate execution, failed tool, timeout, approval gate, fallback and handoff.
- A sample dashboard/question set built around production debugging rather than a vendor UI.

## Recommended outline

## What agent observability needs to answer

### Which business run is this?

### What did the agent attempt, and what was it allowed to do?

### Did the workflow finish safely?

## The minimum event model for a production agent

### Run and trace identifiers

### Agent identity, model and versioned instructions

### Tool calls, permissions and action boundaries

### Latency, token usage, cost and rate-limit state

### Errors, retries, fallbacks and terminal state

### Human handoff and approval events

## What not to log

### Sensitive payloads and data minimization

### Prompt snapshots without hidden reasoning

### Retention, redaction and access control

## A practical event schema

### Example event fields

### Correlating a tool call to an external API request

## Failure modes observability should expose

### The agent called the wrong tool

### A retry created duplicate work

### The provider timed out or fell back

### A human took over

## From traces to operational decisions

### Alerts that are useful

### Metrics that should not become vanity dashboards

## Checklist before shipping

## Real-world examples

- **Firsthand input required:** document one real RafaOps run from trigger to final state, using only non-sensitive telemetry and clearly labelling the scope of the example.
- **Firsthand input required:** document the current incident/recovery decision path if it can be shared accurately.
- A hypothetical support-agent handoff may illustrate the schema, but must be labelled as hypothetical.

## Visual opportunities

- Run lifecycle diagram: trigger → model → tool → validation → approval/handoff → final state.
- Event-schema table with `log`, `redact`, `hash` and `do not collect` columns.
- Failure matrix connecting incidents to fields and operator actions.

## Linkable asset opportunity

`AI Agent Event Schema` as a maintained, framework-neutral JSON example plus observability checklist. It is useful only if the schema is versioned, documented and not a marketing PDF.

## Internal links in

- `/rafaops/` — from the execution-evidence section; anchor: `observability for production agents`.
- `/articles/eu-ai-act-ai-agents-2026/` — from the logging/operational evidence discussion; anchor: `operational traces and agent observability`.
- Future `AI Agents in Production` pillar — anchor: `monitoring and operating agents`.

## Internal links out

- `/rafaops/` — `a public example of run evidence`.
- `/articles/eu-ai-act-ai-agents-2026/` — `logging versus regulatory record-keeping`.
- `/articles/ai-agents-for-customer-support/` — `human handoff in a support-agent workflow`.
- Future `AI Agents in Production` pillar — `the broader production architecture`.

## Suggested anchor text

- `logging agent runs`
- `observability for production agents`
- `a public example of run evidence`
- `human handoff in a support-agent workflow`
- `logging versus regulatory record-keeping`

## Commercial connection

`/copywriting/`: **OPTIONAL**. Add one closing contextual link only if the conclusion addresses how AI/infrastructure companies explain these operational topics to technical buyers. Do not add a service CTA in the middle of the engineering sections.

## CTA

Primary CTA: link to the event-schema/checklist asset. Secondary contextual CTA: `/rafaops/`. A writing-service CTA is optional and must not compete with the technical resource.

## Upwork portfolio value

HIGH. It demonstrates engineering judgment on a current B2B AI topic, practical operational thinking and the ability to communicate complex systems accurately.

## Sources to research

- [OpenAI: A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- [Vercel: AI agent observability](https://vercel.com/i/ai-agent-observability)
- Provider documentation for any cited tracing/evaluation product.

## Claims requiring verification

- Any statement about a provider's trace retention, pricing or data handling.
- Any regulatory claim connecting logs to a legal obligation.
- Any statement about RafaOps telemetry, incidents or recovery behaviour.
- Cost or latency figures from examples.

## Content risks

- Becoming a vendor listicle instead of an operational reference.
- Recommending storage of sensitive prompts/payloads or hidden chain-of-thought.
- Duplicating the architecture article rather than focusing on evidence and operations.
- Overclaiming personal production experience without a documented example.
