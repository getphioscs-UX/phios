# PJA-W0 Runtime Preservation Map

Status: **Frozen v1.0.0**  
Baseline: `main@fbd136e6d53de37bad2fd53fcc8c6c1753b3830b`

PJA renders the Reality Journey but does not own the Reality Journey. The
following Runtime boundaries remain unchanged.

| Preserved Runtime concern | Current authority | PJA may consume | PJA must not do |
| --- | --- | --- | --- |
| Journey identity and stage state | Runtime Kernel and frozen Runtime contracts | identifiers, customer stage projection, readiness state | mint identity, rename canonical states or create a parallel lifecycle |
| Transition authority | `RuntimeKernel.applyTransition` and transition contracts | allowed next-step projection | bypass gates or apply a transition from page state |
| Entry and Question routing | Entry rules/router; future PWS-I9 route governance | bounded prompts, route result, fallback presentation | persist Question Route or treat a Provider response as route authority |
| Evidence boundary | Reading Evidence contracts and source classification | source labels, known/unknown boundaries | promote customer text, professional notes or Provider output into formal Evidence |
| Reconstruction | Core Runtime reconstruction rules and API | reconstruction projection | create formal Reconstruction outside Runtime |
| Reading | Core Runtime Reading rules, evidence boundary and provider gate | Reading projection and explanation | generate or accept a formal Reading directly in PJA |
| Navigation | Core Runtime path rules and Navigation contracts | path choices, review gate and recovery state | create a path that bypasses Reading or canonical action rules |
| Review | Review contract and review builder | review projection and correction affordance | mark canonical acceptance from a visual control alone |
| Memory and Continuity | Memory/Continuity contracts and builders | continuity summaries and next-step links | turn public preferences into Runtime Memory or professional responsibility |
| Timeline, lineage and revision | append service, lineage stores and revision service | trace and revision projection | rewrite history, collapse source identity or mutate lineage |
| Persistence and recovery | Runtime persistence router, drivers and recovery service | availability and recovery result | introduce PJA storage as canonical fallback |
| Provider execution boundary | stage-specific routers/adapters and shared provider interface | provider disclosure, bounded availability and failure state | direct paid invocation, formal-object promotion or Provider Cost accounting |
| Security and privacy | Runtime access, classification and privacy services; future PWS-I8 consent | permitted/denied projection | infer authorisation from page visibility or local session state |

## Preserved stage sequence

```text
Entry
→ Reconstruction
→ Reading
→ Navigation
→ Review
→ Memory
→ Continuity
```

Customer-facing labels may map these stages to Describe, Discover, Understand,
Choose and Continue. That is presentation only; the canonical stage states and
transition graph do not change.

## Runtime failure boundary

If Runtime state cannot be read, PJA shows recovery, unavailable or safe
orientation. It does not reconstruct canonical state from local storage,
query parameters, page markup, demo fixtures, previous UI labels or Provider
output. A retry requests the owning Runtime operation; it is not a second
operation implementation.

## Preservation evidence

PJA-W0 changes no Runtime JavaScript, API, Provider adapter, persistence
driver, migration, event, lineage, revision or page. The machine freeze asserts
Journey identity, stage states, transition authority, Evidence, Reading,
Navigation, Review/Memory/Continuity, lineage, persistence/recovery and
Provider execution are all preserved.
