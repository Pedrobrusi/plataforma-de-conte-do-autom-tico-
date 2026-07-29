# Security, Governance and Responsible Modeling

## Tenant isolation

- All tenant data is workspace-scoped.
- Generated SQL enables RLS for workspace-owned tables.
- Access is role-based: owner, admin, editor, viewer.
- Service credentials are runtime secrets and never part of AMDL, prompts, events or generated logs.

## Agent security

- Tools belong to AIOS, not to agents.
- An agent manifest contains permissions, not credentials.
- Each run records plan, tools, model route, tokens, cost, outcome and evaluation.
- External writes require approval and are separately audited.
- Budgets, timeouts, retries and workspace scope are enforced at runtime.

## Web evidence and crawling

The Offer Intelligence crawler is limited to owned, licensed, authorized or public-reference sources. It must:

- respect access control and authentication boundaries;
- respect robots directives and explicit opt-out signals;
- use a declared rate limit and crawl scope;
- avoid collecting unnecessary personal data;
- retain source URL, capture time, permission basis and checksums;
- support deletion and reprocessing.

It must not bypass authentication, evade access controls or exploit hidden endpoints.

## Reference modeling and originality

“Cloning” is replaced by **authorized structural analysis and original modeling**.

Permitted outputs:

- generic funnel sequence;
- abstract content hierarchy;
- high-level persuasion pattern;
- independently generated component and page structure;
- new copy, design and assets.

Excluded outputs:

- copied source copy;
- copied testimonials or endorsements;
- copied proprietary media;
- impersonated brand identity;
- distinctive layout reproduction intended to confuse users;
- fabricated experts, reviews, results or social proof.

## Claims

Material claims require an evidence register and review. Ad activity is treated as a market signal and never automatically represented as proven revenue or profitability.

## Audit and incident response

Every material action records:

- actor and agent;
- workspace;
- target;
- evidence;
- policy decision;
- approval;
- correlation ID;
- cost and latency;
- result.

Critical policy failures produce an operational alert in Mission Control and require human notification.
