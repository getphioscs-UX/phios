# Method Runtime Architecture

## Platform position

PHI OS maintains four distinct platform lines:

| Platform line | Responsibility |
| --- | --- |
| Knowledge Runtime | Published knowledge authority |
| Journey Runtime | Reality evidence and Reality Navigation |
| Method Runtime | Governed method calculation, projection and candidate interpretation |
| Professional Workspace | Professional service, review, delivery and client management |

No line is a substitute for another.

## MR-W0 components

| Component | MR-W0 contract |
| --- | --- |
| Method Runtime Platform | One singleton platform, version 1.0.0 |
| Method Registry | Contract frozen; population belongs to MR-W1 |
| Plugin Registry | Plugin-only registration, no Runtime fork |
| Shared Data Authority | Method-neutral source and normalization authority |
| Shared Calculation Runtime | Deterministic execution only |
| Shared Projection Runtime | Versioned Projection JSON only |
| Shared Interpretation Runtime | Interpretation Candidate only |
| Shared Professional Runtime | Independent review, signature and release |
| Runtime Boundary | No required Journey, Knowledge or Professional Workspace dependency |
| Governance Contract | IMR before Production |

## Processing architecture

~~~text
IMR-approved Method Definition
↓
Shared Data Authority
↓
Shared Calculation Runtime
↓
Projection JSON
↓
Shared Interpretation Runtime
↓
Interpretation Candidate
↓
Independent Professional Runtime
↓
Authorized Professional Deliverable
~~~

Optional Published Knowledge and Journey Runtime context may enter Interpretation through adapters. They do not enter Calculation and do not create a structural dependency.

## Method-specific modules

HDR, AST and BZR may each supply a method-specific deterministic engine. Those engines are modules registered under Shared Calculation Runtime. The phrase “independent Calculation Runtime” in a method roadmap means an independently versioned calculation module, not an independent PHI OS Runtime.

## Method Fusion boundary

Method Fusion Runtime is a governed projection-coordination component. It does not create a second Method Runtime and does not declare a fused projection to be Reality.

~~~text
Method projections
↓
Fusion coordination
↓
Method Projection
+
Reality Evidence
↓
Journey Runtime
~~~

## Professional Workspace boundary

Professional Workspace reads governed Knowledge Runtime, Journey Runtime and Method Runtime outputs. It does not directly read OpenAI or Workers AI. Provider results first become Interpretation Candidates, pass Rule Validation and Governance, then enter independent Professional Review.

