# PWS-I1-T00 Baseline Contract Audit

Status: **Audited / not implemented**  
Audit baseline: `main@56cb46aaa2695693525e20901022d06b126b5a89`

This is the entry audit for PWS-I1. It records the present Contract landscape
without creating a Contract, Schema, Registry entry, Migration or production
behaviour.

| Area | Status | Current source | Baseline finding | PWS-I1 freeze |
|---|---|---|---|---|
| Glossary | Partial | `Content/glossary/en.json`, `zh-Hans.json` | Bilingual sources exist; PWS/PJA terms are not consolidated | Reuse first |
| Objects | Partial | W2 ownership v1 | 28 logical owners; physical modules remain incomplete | W2 is authoritative |
| Identifiers | Partial | `assets/js/core/ids.js`, `assets/js/shared.js` | Multiple generators and naming styles | No third generator |
| Schema Version | Partial | Runtime schema registry, feature constants | Central Runtime acceptance plus local versions | Audit aliases first |
| States | Partial | Runtime and Professional contracts | Domain-owned, distributed definitions | Preserve owners |
| Operations | Partial | API, Runtime services, Professional modules | Three operation surfaces coexist | API cannot invent state |
| Events | Partial | Runtime timeline, access audit | Versioned Runtime events; bounded payload-free access audit | Preserve separation |
| Errors | Partial | security, persistence, lineage, recovery contracts | Typed families; no common catalogue | No ad-hoc duplicate code |
| Directories | Partial | `functions/runtime`, `functions/professional` | Logical W2 owners precede physical convergence | No parallel tree |
| Contract IDs | Partial | Runtime contract registry | 20 registered Runtime contracts plus local constants | Count remains 20 |
| Permissions | Partial | Runtime access boundary, W1 authorisation | Two bounded checks with explicit responsibilities | W1 order is frozen |
| Tests | Partial | `scripts`, `package.json` | 106 check scripts before W3 | Frozen checks remain green |
| Legacy JPR/PJA Terms | Partial | PJA duplication audit | PJA is programme/architecture terminology; no active JPR token found | PJA cannot duplicate Runtime/PWS |

## Baseline counts

| Invariant | Baseline |
|---|---:|
| Content Registry entries | 48 |
| Runtime Contracts | 20 |
| Runtime Migrations | 4 |
| W2 ownership objects | 28 |

## Material findings

1. `56cb46a` delivered six W1 access modules one directory above their frozen
   path. Their contents are retained and restored to
   `functions/professional/access/`.
2. Identifiers, schema versions and errors already have usable bounded
   implementations, but not a single cross-domain catalogue.
3. A physical `runtime/<owner>` tree must not be generated from the W2 logical
   map. Canonical implementation belongs to later authorised tickets.
4. PJA must compose existing PWS and Runtime objects; it must not recreate
   Journey, Evidence, state, API, Registry or Persistence.

## T00 decision

PWS-I1 may begin only from the W3 sequence gate. T00 itself introduces no
Contract. The next implementation must resolve terminology and identifiers by
reference or adapter before adding any canonical definition.
