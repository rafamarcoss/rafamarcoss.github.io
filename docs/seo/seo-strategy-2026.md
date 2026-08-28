# SEO strategy 2026 — research phase

Date: 2026-08-28
Scope: research and documentation only. No public page, article, metadata, redirect or production SEO change is included in this file.

## Method and limits

- Repository inventory: current branch `v2/site-redesign`, commit `a3174eb`.
- Current SERP sample: English-language Google results inspected on 2026-08-28. It is directional research, not rank tracking.
- No reliable keyword-volume or keyword-difficulty dataset is available in the repository or connected tools. Every `Opportunity` and `Competition` label below is a **relative opportunity estimate**, not a verified metric.
- No local GSC performance export exists. The repository has sitemap submission and URL-inspection tooling, but no clicks, impressions, query or position report.

## Executive strategy

The site has a credible starting position: an engineer's portfolio, a commercial writing page, five substantive English articles and public project evidence. The main opportunity is not to compete for generic `AI content writer`; it is to own the intersection of **production AI agents, integrations and technical writing for B2B software**. The main weakness is thin topical depth: five articles create useful proof but not yet a defensible cluster. Build two connected editorial clusters first—AI agents in production and automation/integrations—with CRM as a commercial-use-case lane. Keep AI regulation as a narrow authority lane, refreshed only when source material changes. `/copywriting/` should own writing-service intent; Home should remain brand/engineering-led; `/articles/` should remain an editorial hub, not a second service page. The next 6–12 months should favour 12–16 deeply researched pieces, 2–3 public engineering assets and a GSC-led refresh loop over high-volume publishing.

## Current indexable inventory

`sitemap.xml` contains 21 URLs: Home (1), Copywriting (1), Articles hub plus five articles (6), RafaOps and Portfolio Automation (2), and AI Signal / archive URLs (11). `robots.txt` allows crawling and declares the sitemap. Current indexable pages include canonical URLs, descriptions, Open Graph tags and JSON-LD. Articles use `BlogPosting`; the index uses `CollectionPage`; systems use `WebPage`/`CreativeWork`; Home uses `Person`.

### Current architecture assessment

```text
/                         Brand + AI automation engineer + technical writer
/copywriting/             Commercial service page
/articles/                Editorial navigation hub
/articles/<slug>/         Informational / authority pages
/rafaops/                 Public engineering evidence
/projects/.../            Public engineering evidence
```

This is the right conceptual architecture. Do not make Home, `/copywriting/` and `/articles/` compete for the same query.

## Keyword map

| Keyword | Intent | Target URL | Opportunity | Competition | Business value |
|---|---|---|---|---|---|
| `technical SEO content writer` | Commercial investigation | `/copywriting/` | Medium | Medium–High | High |
| `SaaS content writer` | Commercial investigation | `/copywriting/` | Medium | High | High |
| `B2B SaaS content writer` | Commercial investigation | `/copywriting/` | Medium | High | High |
| `technical writer for AI companies` | Commercial investigation | `/copywriting/` | Medium | Medium | High |
| `AI content writer` | Commercial investigation | `/copywriting/` | Low | High; marketplaces dominate | Medium |
| `technical copywriter` | Commercial investigation | `/copywriting/` | Low | High / broad | Medium |
| `AI agents vs automation` | Informational | `/articles/ai-agents-vs-traditional-automation/` | Medium–High | Medium | High |
| `AI agents for customer support` | Informational / commercial investigation | `/articles/ai-agents-for-customer-support/` | Medium | Medium–High | High |
| `SaaS automation` | Informational | `/articles/what-is-saas-automation/` | Medium | High | High |
| `CRM automation workflows` | Informational / commercial investigation | `/articles/crm-automation-7-workflows/` | Medium | High | High |
| `AI agent observability` | Informational / commercial investigation | future article | Medium | Medium–High | High |
| `AI agent architecture` | Informational | future article | Medium | High | High |
| `AI agent guardrails` | Informational | future article | Medium | Medium | High |
| `AI agent cost` | Informational / commercial investigation | future article | Medium | Medium | High |
| `AI agent compliance` | Informational / commercial investigation | future article | Medium | Medium–High | High |

### Commercial SERP reading

`SaaS content writer` and close variants show independent specialists alongside agencies and marketplace/job pages. Freelancers do rank, but the stronger independent pages make niche, portfolio evidence, process and pricing or engagement model explicit (for example [Sam Lauron](https://www.samlauron.com/freelance-content-services) and [Sanketee Kher](https://sanketeekher.com/)). `AI content writer` is less attractive as a primary target: its results are noisier and marketplace-heavy, as illustrated by [Freelancer's hiring page](https://www.freelancer.com/hire/ai-content-writing). The commercial differentiator should therefore be technical credibility, not a claim to write about AI.

Recommended commercial positioning: **Technical SEO content writer for SaaS, AI and automation companies — written by an AI automation engineer.**

## Existing content map

| Existing URL | Current role | Primary topic | Recommended cluster | Action |
|---|---|---|---|---|
| `/articles/what-is-saas-automation/` | Broad evergreen explainer | SaaS automation, APIs, webhooks, CRM | Automation & integrations | EXPAND into the cluster hub after supporting pages exist |
| `/articles/ai-agents-vs-traditional-automation/` | Decision framework | deterministic workflows vs agents | AI agents in production | KEEP; make it the comparison gateway |
| `/articles/ai-agents-for-customer-support/` | Use-case implementation | support agents, tools, guardrails, handoff | AI agents in production | EXPAND with an architecture diagram and evaluation/metrics section |
| `/articles/crm-automation-7-workflows/` | Practical workflow list | CRM workflow patterns | CRM automation | UPDATE after a real implementation can add failure modes, data model and ownership |
| `/articles/eu-ai-act-ai-agents-2026/` | Regulatory authority | AI Act, production controls | AI regulation & governance | KEEP and refresh only on factual/legal change |
| `/articles/` | Editorial hub | technical writing portfolio | Hub, not a keyword landing page | KEEP; improve taxonomy only when the cluster depth warrants it |
| `/copywriting/` | Commercial conversion | technical SEO content service | Commercial destination | UPDATE later with proof and process; do not split into doorway pages now |

### Current link findings

Every current article links to `/copywriting/`; each also has 2–4 contextual article links. That is a good start, but the commercial link should remain a contextual end-of-article option, not become a repeated boilerplate route. `what-is-saas-automation` overuses the same comparison URL and needs link diversification in a future editorial update.

## Recommended topic clusters

### 1. AI Agents in Production — primary cluster

- **Pillar concept:** `AI Agents in Production: Architecture, Guardrails and Operations` only after at least four supporting pieces are live.
- **Existing support:** `AI Agents vs Traditional Automation`, `AI Agents for Customer Support`, `EU AI Act for AI Agents`.
- **Missing support:** architecture, observability, guardrails, evaluation, cost controls, security and implementation workflow.
- **Commercial connection:** strongest proof for AI, agent-platform, developer-tool and infrastructure writing clients.
- **Link flow:** use-case/comparison → architecture or observability → pillar → `/copywriting/` only where a reader is evaluating technical content.

### 2. Automation & Integrations — primary cluster

- **Pillar concept:** evolve `What Is SaaS Automation?` into a hub only after API/webhook/integration reliability support exists.
- **Existing support:** SaaS automation explainer, agent-vs-automation comparison, CRM workflows.
- **Missing support:** API automation, webhook reliability, integration architecture, n8n production patterns, automation observability.
- **Commercial connection:** strong fit for B2B SaaS, RevOps, CRM and integration vendors.
- **Link flow:** implementation article → SaaS automation hub → CRM or agent comparison → relevant service page only when content marketing is the reader's job-to-be-done.

### 3. CRM Automation — supporting commercial-use-case lane

- **Pillar concept:** no standalone pillar yet.
- **Existing support:** `CRM Automation: 7 Workflows...`.
- **Missing support:** data ownership, lead routing, CRM/API sync, lifecycle automation.
- **Commercial connection:** high; concrete buyer outcomes make strong Upwork portfolio evidence.
- **Link flow:** CRM workflow → SaaS automation hub → integration reliability / agent comparison.

### 4. AI Regulation & Governance — narrow authority lane

- **Pillar concept:** none now; one high-quality regulatory page is enough until two more evidence-led supports exist.
- **Existing support:** EU AI Act page.
- **Missing support:** engineering checklist for Article 50; production logging vs legal record-keeping.
- **Commercial connection:** credibility, especially for AI vendors; not a volume-production lane.

Do not build an editorial cluster around `technical content marketing` or `SaaS SEO` yet. It would blur the service page's intent and lacks unique operating evidence.

## SERP and competitive reading

### Informational SERP patterns

- `AI agent architecture` is fresh, long-form and technical. The sampled results include agency/independent guides around 18–31 minutes and vendor/developer references such as [JetBrains](https://www.jetbrains.com/pages/ai-agents/architecture/ai-agent-architecture/). The expected format is diagrams, components, runtime controls and trade-offs—not a generic definition.
- `AI agent observability` has vendor-led and comparison results, including [Vercel's engineering guide](https://vercel.com/i/ai-agent-observability). A credible entrant needs a narrow original angle: what to log, how to join tool calls to business outcomes, and real incident/recovery examples.
- CRM/SaaS automation SERPs are generally vendor and large-publisher heavy. Better entry points are specific operational questions: webhook retries, CRM source-of-truth, duplicate prevention, lifecycle handoffs.
- The opportunity is not shorter content. It is **information gain**: a diagram, decision table, code/API example, failure mode, cost model or production evidence that a generic marketing page cannot supply.

### Competitor categories

| Category | Examples | What to learn, not copy |
|---|---|---|
| Business competitors | Freelance SaaS writers such as [Sam Lauron](https://www.samlauron.com/freelance-content-services), [Sanketee Kher](https://sanketeekher.com/) | sharp vertical positioning, evidence, service packaging |
| Agency competitors | [Infrasity](https://www.infrasity.com/), [Reclear](https://reclear.io/), [Studio1](https://www.studio1hq.com/) | developer-first positioning, proof, technical depth |
| Editorial SERP competitors | [JetBrains' architecture reference](https://www.jetbrains.com/pages/ai-agents/architecture/ai-agent-architecture/), [Vercel's observability guide](https://vercel.com/i/ai-agent-observability) | expected technical format and freshness threshold |
| Marketplace competitors | [Freelancer](https://www.freelancer.com/hire/ai-content-writing) and job listings | avoid competing on generic `AI content writer` or price |

## Pillar-page rule

Do not publish a pillar page immediately. Create one only when it can link to at least four genuinely distinct supports and answer a higher-level decision better than those pages do. First candidate: `AI Agents in Production: Architecture, Guardrails and Operations`, after the architecture, observability, guardrails and evaluation pieces. Second candidate: evolve `What Is SaaS Automation?` after API, reliability and integration-architecture pieces exist.

## Internal link map

### Current articles

```text
AI Agents for Customer Support
→ AI Agents vs Traditional Automation — "fixed workflows and reasoning agents"
→ What Is SaaS Automation? — "the integration layer underneath the agent"
→ future AI Agent Guardrails — "tool permissions and safe handoff"
→ /copywriting/ — "technical content for AI support products" (only in the closing service context)

AI Agents vs Traditional Automation
→ What Is SaaS Automation? — "deterministic plumbing"
→ AI Agents for Customer Support — "a support-agent implementation"
→ future AI Agent Architecture — "how the two layers work together"
→ /copywriting/ — "content about automation products" (closing context)

CRM Automation: 7 Workflows
→ What Is SaaS Automation? — "CRM as the source of truth in a SaaS stack"
→ future CRM Data Ownership — "single source of truth"
→ future Webhook Reliability — "prevent duplicate CRM actions"
→ /copywriting/ — "SEO content for CRM and RevOps software" (closing context)

What Is SaaS Automation?
→ CRM Automation: 7 Workflows — "practical CRM workflow examples"
→ AI Agents vs Traditional Automation — "where AI fits after deterministic automation"
→ future API Automation — "API contracts and authentication"
→ future Webhook Reliability — "event delivery and retries"

EU AI Act for AI Agents
→ AI Agents for Customer Support — "human handoff in a real use case"
→ future AI Agent Observability — "operational traces and evaluation"
→ future AI Agent Guardrails — "permissions, limits and approval"
→ /copywriting/ — "technical SEO content for AI products" (only after the engineering conclusion)
```

### Project evidence links

RafaOps should link to future `AI Agent Observability` and `AI Agents in Production` pillar. Portfolio Automation should link to `SaaS Automation` and `Webhook Reliability`. These are evidence-to-editorial links, not sales CTAs.

## 20-article roadmap

| Priority | Proposed title | Primary keyword | Intent | Cluster | Differentiation | Business value | Upwork value |
|---|---|---|---|---|---|---|---|
| P0 | `AI Agent Observability: What to Log in Production` | `AI agent observability` | Informational / commercial investigation | AI agents | trace schema, business outcome fields, incident example | High | HIGH |
| P0 | `AI Agent Architecture: A Practical Reference for Production Systems` | `AI agent architecture` | Informational | AI agents | architecture diagram and decision table | High | HIGH |
| P0 | `AI Agent Guardrails: Tool Permissions, Validation and Human Approval` | `AI agent guardrails` | Informational | AI agents | concrete control layers and failure cases | High | HIGH |
| P0 | `Webhook Reliability: Retries, Idempotency and Duplicate Events` | `webhook reliability` | Informational | Automation | API examples and replay strategy | High | HIGH |
| P0 | `CRM Data Ownership: How to Keep One Source of Truth Across Your SaaS Stack` | `CRM data ownership` | Informational / commercial investigation | CRM | data-model diagram and conflict rules | High | HIGH |
| P0 | `AI Agents in Production: Architecture, Guardrails and Operations` | `production AI agents` | Informational | AI agents | pillar built from the five supporting pages | High | HIGH |
| P1 | `API Automation: When a Workflow Tool Is Enough and When You Need Code` | `API automation` | Informational / commercial investigation | Automation | decision framework with authentication and limits | High | HIGH |
| P1 | `AI Agent Evaluation: Test Cases That Catch Real Failures` | `AI agent evaluation` | Informational | AI agents | eval matrix, pass criteria and regression examples | High | HIGH |
| P1 | `AI Agent Cost Controls: Budgets, Limits and Failure Modes` | `AI agent cost` | Informational / commercial investigation | AI agents | cost model and runaway-loop scenarios | High | HIGH |
| P1 | `n8n in Production: Error Handling, Idempotency and Observability` | `n8n production` | Informational / commercial investigation | Automation | workflow patterns based on operations experience | High | HIGH |
| P1 | `CRM Lead Routing: Rules, Exceptions and Ownership` | `CRM lead routing` | Informational / commercial investigation | CRM | routing matrix and audit trail | High | HIGH |
| P1 | `AI Agent Security: A Practical Threat Model for Tool-Using Systems` | `AI agent security` | Informational | AI agents | permissions, data scopes and tool allowlists | High | HIGH |
| P1 | `Building AI Agents for SaaS: Start With the Workflow, Not the Model` | `AI agents for SaaS` | Informational / commercial investigation | AI agents | implementation sequence and SaaS case study | High | HIGH |
| P1 | `Automation Observability: How to Know a Workflow Actually Worked` | `automation observability` | Informational | Automation | status model, run evidence and alert taxonomy | Medium–High | HIGH |
| P1 | `AI Agent Compliance: An Engineering Checklist Before Launch` | `AI agent compliance` | Commercial investigation | Governance | separates legal advice from implementation controls | High | HIGH |
| P2 | `CRM API Integration: Data Mapping, Webhooks and Failure Handling` | `CRM API integration` | Informational / commercial investigation | CRM | field map and retry design | High | HIGH |
| P2 | `Human Handoff for AI Agents: Design the State Transition, Not a Fallback` | `AI agent human handoff` | Informational | AI agents | state machine and support workflow | High | HIGH |
| P2 | `SaaS Automation Architecture: APIs, Events and Operational Boundaries` | `SaaS automation architecture` | Informational | Automation | reference architecture diagram | High | HIGH |
| P2 | `Technical Content for Developer Tools: What a Writer Needs Before Drafting` | `developer tools content writer` | Commercial investigation | Commercial support | client-facing discovery checklist | Medium | HIGH |
| P2 | `Writing Technical SEO Content for AI Products Without Making Unsupported Claims` | `AI SEO content` | Commercial investigation | Commercial support | editorial standards and source workflow | Medium | HIGH |

### Quick-win opportunities

1. `AI agent observability` — technical, current, and naturally supported by RafaOps evidence.
2. `AI agent guardrails` — specific enough to avoid generic AI summaries; strong engineering differentiation.
3. `webhook reliability` — integration buyers value implementation detail; generic results often lack operations evidence.
4. `CRM data ownership` — narrow long-tail business problem, good fit with current CRM article.
5. `AI agent evaluation` — demand is technical and framework-neutral; use real test design rather than tool promotion.
6. `AI agent cost controls` — commercial relevance and a useful decision-table format.
7. `automation observability` — under-served by generic workflow content; align it to RafaOps.
8. `n8n production` — only if the article contains genuine implementation evidence, not a generic tutorial.
9. `CRM lead routing` — clear revenue-operations outcome and a natural expansion of the workflow article.
10. `AI agent human handoff` — specific use-case query that extends the strongest existing support article.

### Aspirational keywords, 6–12 months

- `technical SEO content writer`
- `SaaS content writer`
- `B2B SaaS content writer`
- `AI agent architecture`
- `SaaS automation`

## Backlink plan

### Immediate

- Publish useful project explanations from existing RafaOps and Portfolio Automation evidence, then share only where the resource answers an active technical discussion.
- Contribute non-promotional answers and diagrams to relevant developer communities, GitHub discussions and n8n ecosystem channels when they solve the question being asked.
- Turn each strong article into one concise technical visual/decision table suitable for a newsletter or community post, with the canonical article as the source.
- Create profiles only where they show real work: GitHub README/project pages, Upwork portfolio entries and LinkedIn featured work.

### Build first

- Pitch an original `AI Agent Production Readiness Checklist` or `AI Agent Observability Schema` to AI/devtool newsletters and engineering publications after it has code, a template or a reference implementation.
- Offer a technical guest article to developer-first agencies/publications only with a distinct implementation angle; do not mass-email generic guest-post requests.
- Submit a maintained n8n or automation template with documentation to the relevant ecosystem directory/community.

### Aspirational

- Technical podcasts and practitioner newsletters once there are several public assets and an opinionated implementation record.
- Vendor ecosystem co-marketing or integration pages when Rafael has actually built against the vendor's API.
- Expert-source platforms and journalist requests only when the answer can be grounded in demonstrated systems, not general AI commentary.

### Five linkable assets

| Asset | Audience | Why it can earn backlinks | Effort | Cluster |
|---|---|---|---|---|
| `AI Agent Production Readiness Checklist` | engineering leads, AI startups | reusable launch checklist with an evidence model | Medium | AI agents |
| `AI Agent Observability Event Schema` | developers, observability teams | framework-neutral JSON/event reference and sample dashboard | Medium–High | AI agents |
| `Webhook Retry and Idempotency Playground` | API/integration developers | interactive reproduction of duplicate-event failure modes | High | Automation |
| `CRM Automation Failure Mode Matrix` | RevOps and SaaS teams | practical matrix for ownership, retries, duplicates and handoff | Medium | CRM |
| `AI Act Engineering Controls Matrix` | AI product teams | maps engineering controls to official sources without giving legal advice | High | Governance |

Engineering is the link-building mechanism: build a useful asset, publish its reasoning and examples, then make it easy to cite. The asset must stand alone; a generic blog post does not create the same reason to link.

## Copywriting page strategy — future implementation only

- **Primary keyword:** `technical SEO content writer`.
- **Secondary keywords:** `SaaS content writer`, `B2B SaaS content writer`, `technical writer for AI companies`, `developer tools content writer`, `AI content writer` (supporting only).
- **Intent:** commercial investigation; readers compare specialist writers, agencies, proof and process.
- **H1 direction:** `Technical SEO Content Writing for SaaS, AI & Automation` is aligned and should remain close to the current direction.
- **Missing sections to consider:** operating process from technical discovery to source review; who the work is for/not for; concrete deliverable examples; byline/published-work proof; technical stack/topics; testimonial or client proof when available; a small FAQ only for genuine objections.
- **Proof needed:** published samples, project evidence, technical source methodology, measurable client outcomes when they can be substantiated. Do not invent case studies.
- **Internal links:** selected writing cards now work well; add one link from relevant future articles only when the reader could plausibly hire a writer for that product category.
- **CTA:** keep one primary `Start a project` action. The next step should ask for product, audience, goal and current documentation; avoid multiple competing CTAs.

Do not create `/technical-seo-content-writer/`, `/saas-content-writer/` or `/ai-content-writer/` now. The SERPs overlap heavily and the site lacks enough distinct proof to prevent doorway-page risk. One stronger service page is the better strategy.

## E-E-A-T and quality controls

- Create a real author/about page only if it adds career history, working context, GitHub/project evidence and current role—not a generic biography.
- Keep named author, dates, source links and first-hand implementation sections in technical articles.
- Use primary documentation for factual claims, especially regulation and product APIs.
- Add diagrams, failure modes, decision tables, examples and explicit limits. This is the information gain that generic summaries lack.
- Do not mass-produce AI content. Google's guidance explicitly prioritises helpful, reliable, people-first work with first-hand expertise and warns against scaled search-first content ([Google Search Central](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).

## GSC operating process

Current code: `gsc-submit-sitemap.mjs` submits the sitemap; `gsc-inspect.mjs` inspects URL index status and writes `reports/gsc-index-status.json`; both use a service account from `GSC_SERVICE_ACCOUNT_JSON`. Do not expose that value. There is no local Search Analytics reporting or performance export.

### Weekly review, once data exists

1. Export 28-day and prior-28-day Search Console data by query and page.
2. Segment branded versus non-branded, country and page.
3. Record impressions, clicks, CTR, average position and trend. Google defines CTR as clicks divided by impressions and explains that average position is an aggregate, not a fixed rank ([Search Console documentation](https://support.google.com/webmasters/answer/7042828?hl=en)).
4. Join the findings to an editorial decision: refresh, expand, link, consolidate or leave alone.

### Decision rules

| Signal | Action |
|---|---|
| High impressions + positions 8–20 | inspect intent mismatch, missing section, internal links and title before drafting a new URL |
| Good position + poor CTR | test title/description only if the current snippet undersells the page |
| One query shows multiple site URLs | compare intent and headings; consolidate or differentiate before adding links |
| Growing query not explicitly served | expand the existing page if intent is adjacent; create a page only if it is distinct |
| Falling impressions/clicks | check seasonality, SERP change, freshness and source accuracy before changing copy |
| Regulatory article changed factually | update sources and facts; do not change dates without substantive revision |

Google recommends examining trends in impressions and clicks, not position alone, and using queries/pages to assess content effectiveness ([Search Console guidance](https://support.google.com/webmasters/answer/17010961?hl=en)).

## Content refresh policy

- Review P0/P1 technical pages every 90 days using GSC data and source changes.
- Review AI regulation pages after material official guidance or enforcement changes.
- Add internal links whenever a genuinely related article becomes available.
- Change dates only after a meaningful factual, structural or evidence-led update.

## Top 10 highest-leverage actions

1. Publish `AI Agent Observability: What to Log in Production` with a real RafaOps-derived evidence model.
2. Publish `AI Agent Architecture: A Practical Reference for Production Systems` with a diagram and clear limits.
3. Add GSC Search Analytics export/reporting; index inspection alone cannot guide content priorities.
4. Publish `Webhook Reliability: Retries, Idempotency and Duplicate Events` with concrete implementation patterns.
5. Diversify and formalise internal links around the existing SaaS automation article; remove repeated links to the same comparison.
6. Publish `AI Agent Guardrails` with tool-permission and approval examples.
7. Strengthen `/copywriting/` later with real proof, discovery process and published work—not more keyword variants.
8. Build one linkable `AI Agent Production Readiness Checklist` asset.
9. Update the CRM workflows article only after adding data-ownership and failure-mode expertise.
10. Create the AI-agents pillar only after its supporting pages exist.

## 30 / 60 / 90 days

### First 30 days

- Set up a safe GSC performance export or read-only reporting path.
- Create briefs, source lists and diagrams for the first three P0 articles; publish no more than two if the evidence is ready.
- Audit current internal links against the map when implementing the first new article.
- Define one linkable asset and its public maintenance owner.

### Days 31–60

- Publish the remaining P0 article(s) only after technical review.
- Create the `AI Agent Production Readiness Checklist` and its explanatory page.
- Gather real proof for the future `/copywriting/` update: published samples, project context and source process.
- Review first query/page data and select one expansion or CTR test from evidence.

### Days 61–90

- Publish 2–3 P1 articles based on cluster gaps and GSC signals.
- Decide whether enough supporting content exists for the AI-agents pillar; otherwise defer it.
- Start targeted asset distribution to developer and vendor ecosystems.
- Measure non-branded impressions/clicks, commercial-page assisted paths, indexed URLs, referring domains and Upwork portfolio usage; do not judge success by traffic alone.

## Sources

- [Google Search Central: Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google Search Console: clicks, impressions, CTR and position](https://support.google.com/webmasters/answer/7042828?hl=en)
- [Google Search Console: common performance-report tasks](https://support.google.com/webmasters/answer/17010961?hl=en)
- [OpenAI: A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
- [JetBrains: AI agent architecture explained](https://www.jetbrains.com/pages/ai-agents/architecture/ai-agent-architecture/)
- [Vercel: AI agent observability](https://vercel.com/i/ai-agent-observability)
- [Infrasity: technical content marketing for B2B SaaS](https://www.infrasity.com/)
- [Reclear: technical content marketing for developer-first companies](https://reclear.io/)
- [Sam Lauron: B2B SaaS content writing services](https://www.samlauron.com/freelance-content-services)
- [Sanketee Kher: freelance B2B SaaS content writer](https://sanketeekher.com/)
