---
title: "AI Agent Observability: What to Log in Production"
description: "A framework-neutral reference for tracing production AI agents: runs, tool calls, state changes, cost, handoffs and the data you should not retain."
date: 2026-08-28
updated: 2026-08-28
category: "AI Engineering"
tags: ["ai agent observability", "agent telemetry", "llm observability", "tracing", "tool calls", "production ai"]
slug: "ai-agent-observability"
author: "Rafael Marcos"
related: ["ai-agents-vs-traditional-automation", "ai-agents-for-customer-support", "eu-ai-act-ai-agents-2026"]
humanInsight: "If you cannot reconstruct why an agent called a tool, what happened next and who stopped it, you have logs, not observability."
---

An agent that returns a final answer is not necessarily an agent that completed a safe run. It may have chosen the wrong tool, retried an action after a timeout, exhausted a budget, waited for approval or handed a case to a person. A single prompt and response log cannot explain any of that.

AI agent observability is the ability to reconstruct a business run: what the system attempted, which boundaries applied, what changed outside the model, what failed, what it cost and whether a human became responsible. The useful unit is the run, not the prompt.

That distinction matters more once an agent can call APIs. A wrong draft can be corrected. A duplicate refund, an overwritten CRM field or an unacknowledged escalation is an operational incident. The record has to follow the work across model calls, tools and state transitions without turning your telemetry store into a copy of every customer interaction.

> Observability does not mean storing everything. It means retaining enough evidence to explain a run safely.

## What agent observability needs to answer

Before choosing a tracing product or a dashboard, write the questions an operator must answer. They usually fall into three groups.

### Which business run is this?

Every externally meaningful workflow needs a stable `run_id`: one support case, one report generation, one approval request or one scheduled job. A `trace_id` then ties together the operations that belong to that run across services. OpenTelemetry defines a trace as a tree of spans, where each span represents one operation; context propagation preserves that relationship across process and network boundaries. [Its trace and context documentation](https://opentelemetry.io/docs/specs/otel/trace/api/) is a useful model even when you do not adopt OpenTelemetry directly.

Record the trigger, timestamps, environment, application version and a privacy-safe correlation key for the business object. A run ID answers “which job?”; a trace ID answers “which connected work happened while that job ran?” Do not use an email address or a raw ticket body as either identifier.

### What did the agent attempt, and what was it allowed to do?

The next question is not “what did the model say?” It is “which action boundary did the system cross?” For each model turn and tool call, an operator should be able to see the agent and instruction version, the selected model, the tool name, the permission scope, the validation result and whether a side effect was requested or committed.

Tool calls deserve first-class telemetry because they connect probabilistic output to deterministic systems. Keep a tool-call ID and, where possible, the downstream request or idempotency key. Store an argument summary or allowlisted metadata, not an unfiltered request body. A billing lookup might safely retain `account_lookup` and `record_found`; it should not copy card data into a trace.

### Did the workflow finish safely?

`200 OK` is not a useful final state for an agent. Use explicit states such as `pending`, `running`, `waiting_approval`, `retrying`, `failed`, `completed` and `escalated`. Log the transition, its reason and the actor that made it. The operator can then distinguish a model failure from a workflow that correctly stopped at a permission boundary.

This is especially important for support. A human handoff in a support-agent workflow is not an error path; it is a transfer of ownership. Record the trigger, the context package prepared for the person, acknowledgement and the terminal owner. The implementation pattern is covered in [AI agents for customer support](/articles/ai-agents-for-customer-support/).

## The minimum event model for a production agent

The lifecycle diagram above is deliberately compact: trigger, run and trace, tools and validation, then outcome or handoff. It provides a shared vocabulary for the events that make a run explainable.

## Run and trace identifiers

Start an agent run with `run_id`, `trace_id`, `event_id` and `parent_event_id`. The event ID identifies one immutable record. The parent event ID links an event to the preceding local operation; the trace ID links it to the wider distributed execution. Preserve the trace context across queues and downstream HTTP calls when those calls are part of the same business operation. OpenTelemetry notes that trace and span IDs can correlate logs, traces and metrics across service boundaries, but also warns against accepting untrusted incoming context blindly.

Add a `correlation_key` only when it helps the operator locate the related business record. Prefer a hashed or internal reference over a customer identifier. The goal is correlation, not a shadow customer database.

## Agent identity, model and versioned instructions

Record the agent name, agent version, environment, provider, model identifier and instruction or policy version. These fields make regressions diagnosable: a rise in tool failures after a model or prompt change is actionable; a generic increase in errors is not.

Do not confuse version metadata with a prompt archive. A version ID is normally enough for routine telemetry when the controlled instruction lives in source control. Capture a reviewed snapshot only for a bounded incident workflow, with a stated retention rule and access control.

## Tool calls, permissions and action boundaries

For every tool action, capture:

- Tool name and `tool_call_id`.
- Allowed scope or permission decision.
- Whether the operation is read-only, proposed, approved or committed.
- Start and end timestamps, duration and outcome category.
- An idempotency or external request reference when one exists.
- Redacted input and output summaries that explain the action without storing the payload.

An agent may call `create_refund`, but the observability event should still show whether a policy denied it, whether a human approved it and whether the payment provider accepted the request. This separates a decision from an external side effect.

## Latency, token usage, cost and rate-limit state

Cost is part of observability because retries and fallback loops are execution behaviour. At the run and model-call levels, record duration, input/output token usage where the provider exposes it, the model/provider identifier, rate-limit state and a normalised cost field if your billing data supports it. Avoid hard-coding volatile public price tables into application logs.

Use budgets as state transitions, not just charts. `budget_warning`, `budget_exhausted` and `fallback_selected` explain why a run slowed down, stopped or changed model. Alert on sustained changes in retry rate, tool failure rate, handoff rate and cost per successful outcome; a dashboard full of token totals alone is mostly decoration.

## Errors, retries, fallbacks and terminal state

An error event needs an error class, a safe message, retry count, retry policy and final disposition. “Provider timeout” and “tool validation denied” belong in different operational buckets. Pair a retry with the original operation through a parent event, idempotency key or explicit `retry_of_event_id` so an operator can see whether a retry risks duplicate work.

The public RafaOps system is a small, bounded example of this principle. Its published run record contains task, role, model, attempt status, duration and usage data, while its monitor keeps separate checks, incidents and recovery decisions. See [a public example of run evidence](/rafaops/). It is evidence of that system's scheduled publishing workflow, not a claim about customer-agent production traffic.

## Human handoff and approval events

Handoff needs its own events: `handoff_requested`, `handoff_prepared`, `handoff_acknowledged` and `handoff_completed` are more useful than a single boolean. Include the reason code, destination queue or role, the summary reference delivered to the person and whether the agent is paused. Do not log the full conversation again just to prove the handoff happened.

For approval gates, distinguish `action_proposed` from `action_approved` and `action_committed`. That gap is where a human can reject an unsafe action without the trace pretending that the action succeeded.

## What not to log

The easiest observability failure is collecting more data than anyone can protect or use. A production schema needs explicit exclusions as much as it needs fields.

### Sensitive payloads and data minimisation

Do not write credentials, access tokens, passwords, connection strings, encryption keys or raw sensitive personal data to ordinary logs. OWASP's [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) recommends masking, sanitising, hashing or encrypting sensitive values when they are needed for correlation, and protecting log data from unauthorised access and tampering.

For personal data, start with purpose. The GDPR's Article 5 requires data to be adequate, relevant and limited to what is necessary, and not retained in identifiable form longer than necessary for that purpose. This is an engineering constraint, not legal advice: define retention by event class, redact before export and restrict access by role. The distinction between operational telemetry and high-risk AI-system record-keeping is covered in [logging versus regulatory record-keeping](/articles/eu-ai-act-ai-agents-2026/).

### Prompt snapshots without hidden reasoning

Do not store hidden chain-of-thought. It is neither required to explain an external action nor a safe default telemetry field. Record observable inputs, tool selection, retrieved document IDs, policy decisions and final outputs or summaries when needed. Those are testable system behaviours.

Even prompt and tool payload capture should be opt-in. The OpenAI Agents SDK, for example, documents that generation and function spans may contain sensitive inputs and outputs, and provides a setting to exclude that data while retaining tracing structure. Treat this as the default architecture: spans and events can be useful without storing their content.

### Retention, redaction and access control

Implement redaction at the producer, not as a best-effort clean-up after export. Make a small allowlist for fields that can leave the service. Tag events with `payload_redacted` and `pii_detected` where your detection pipeline is reliable enough to do so; do not claim that a flag makes raw data safe.

Set a retention period per data class. Keep short-lived debugging detail separate from durable aggregate metrics. Give operators the least access needed to investigate a run, and audit access to high-sensitivity stores. Unlimited trace retention is an operational liability, not a sign of maturity.

## A practical event schema for AI agents

The [AI Agent Event Schema](/assets/resources/ai-agent-event-schema.json) is a framework-neutral JSON Schema and example event. It is a practical reference, not an industry standard and not a substitute for provider-specific semantic conventions. It is designed so a team can map its own tracing backend or structured logger onto a minimum event record.

| Field group | Capture | Privacy rule |
| --- | --- | --- |
| Identity | `schema_version`, event and run IDs, timestamps | IDs must not embed personal data |
| Execution | agent, instruction version, provider, model, state | Version IDs, not prompt dumps |
| Tool boundary | tool name, call ID, permission, action state | Summaries or allowlisted metadata only |
| Outcome | status, error category, duration, retry relation | Safe error messages; no secrets |
| Usage | token counts, normalised cost, rate-limit state | Aggregate where individual detail is unnecessary |
| Handoff | reason, destination role, acknowledgement | Reference a secured context package |
| Privacy | `payload_redacted`, `pii_detected`, retention class | Never use flags as permission to retain payloads |

Here is the useful shape of a single event, in plain language: an `agent.turn.completed` event belongs to a run and trace, names the agent/model/instruction revision, reports duration and usage, references its parent event and records a redacted output summary. A `tool.call.completed` child event then names the tool, permission outcome, external request reference and status. The trace tree answers the sequence; the event fields answer the operational detail.

If a tool calls an external API, attach a safe downstream reference such as a hashed request ID or idempotency key. Do not copy the entire API request and response into the event merely because they are available. The schema includes `input_summary`, `output_summary` and `payload_redacted` for exactly this reason.

## Failure modes observability should expose

| Failure mode | Evidence to inspect | Operator action |
| --- | --- | --- |
| Wrong tool selected | agent version, tool name, permission decision, validation result | Review routing or tool descriptions; keep the boundary closed |
| Retry creates duplicate work | retry relation, idempotency key, external request reference | Stop retries until the downstream outcome is known |
| Provider timeout or fallback | error class, duration, retry count, fallback state | Check provider health and budget; compare success after fallback |
| Approval gate blocks action | proposed action, approver role, decision reason | Resolve the business decision without marking the run failed |
| Human takes over | handoff reason, destination, acknowledgement, final owner | Confirm the person received enough context and the agent is paused |

The table is intentionally about decisions rather than vendors. An observability system is useful when it shortens the route from “something looks wrong” to a safe next action.

## From traces to operational decisions

A small project can start with structured JSON events, a persistent run store and one view that groups events by `run_id`. Add alerts only for conditions that somebody can act on: a run stuck in `waiting_approval`, a failed side-effecting tool call, a duplicate-risk retry, a rising fallback rate or a budget threshold.

A growing SaaS system usually needs trace storage with propagated context, separate aggregate metrics, access-controlled detailed events and a clear incident path. It does not need every model message indexed forever. OpenTelemetry's common vocabulary can make cross-service correlation easier; provider tracing can add useful agent-specific spans. Choose the storage and exporter that fit your data boundary rather than choosing a vendor because its dashboard looks complete.

Useful operational questions include:

- Which tool is failing by action type and version?
- Which retries are safe, and which can create duplicate side effects?
- Are handoffs increasing after a policy, model or instruction change?
- Which model path has the highest cost per completed business outcome?
- Which runs stopped intentionally at a permission or approval boundary?

These questions produce engineering work. “How many tokens did we use this month?” may be worth tracking, but it is not enough to operate a tool-using agent.

## Checklist before shipping

- Every business workflow has a `run_id` and terminal state.
- Trace context reaches model calls, tools and downstream requests where it is safe to propagate.
- Tool events include permission and side-effect state, not only a result string.
- Retries link back to the original action and respect idempotency.
- Error categories, fallback decisions and budgets are observable.
- Human handoff records trigger, acknowledgement and final ownership.
- Raw secrets, credentials, hidden reasoning and unnecessary payloads are excluded.
- Redaction, retention and access rules are defined before telemetry leaves the service.
- Alerts map to an operator action, not a vanity metric.
- A test run can be reconstructed without reading a complete customer conversation.

## Final perspective

AI agents are still software, but probabilistic choices and external actions increase the context needed to understand a failure. A good telemetry model makes a run explainable without retaining every piece of data the run touched.

For AI and infrastructure teams, that operational detail also needs to be explained accurately to technical buyers. I write [technical content for AI infrastructure products](/copywriting/) from the same source-first, system-aware perspective.

## Sources

- [OpenTelemetry: Tracing API](https://opentelemetry.io/docs/specs/otel/trace/api/) and [context propagation](https://opentelemetry.io/docs/concepts/context-propagation/) for trace, span and correlation concepts.
- [OpenAI Agents SDK: tracing](https://openai.github.io/openai-agents-js/guides/tracing/) for current agent, tool, guardrail and handoff tracing examples, including sensitive-data controls.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) for secure log-data handling.
- [GDPR, Article 5](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A02016R0679-20160504) for data-minimisation and storage-limitation principles.
