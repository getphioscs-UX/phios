# PWS-I2-W0 Registry Baseline Audit

Status: **Passed — Audit Complete**  
Baseline: `getphioscs-UX/phios`  
Branch: `main`  
Commit: `025f06ef5b18e54f2ad22f6883d1cf30d6288c44`  
Prerequisite: `PWS-I1-v1.0.0-Frozen`

## Conclusion

PHI OS already contains several valid Registry systems, but they do not form
one Universal PWS Registry. The Frozen Core Runtime owns its executable
Contract, Schema, Version and baseline declaration Registries. PKR owns
Canonical Knowledge Nodes and their schemas. D1 owns five immutable executable
migrations through the existing Migration Registry. These sources must remain
separate and must be consumed rather than replaced by PWS-I2.

The PWS-I2 gap is a shared Registry layer for Professional, Capability,
Credential, Method, Service, Product, Offer, Knowledge asset type and
Deliverable type relationships. There is currently no Universal Registry
Schema, Version Store, Relationship Store, Restriction Store, Audit Store,
Event Outbox or Registry Query API.

## Baseline inventory

| Area | Current baseline | Decision |
| --- | --- | --- |
| Core Runtime Registry | 6 modules; 20 Contracts, Schemas, Versions and non-executable baseline declarations | Preserve |
| Persistence | 9-method contract; memory, local and D1 drivers | Preserve |
| D1 | 1 `RUNTIME_DB` binding; 5 executable migrations | Extend only through a new authorised Migration |
| Migration | 5 executable SQL records plus 20 non-executable schema baseline declarations | Keep both meanings explicitly separated |
| Read Model | Runtime, account, professional and specialist projections are distributed | Add Registry-specific reads; do not merge customer projections |
| Static JSON | 111 `content/registry` files; 48 legacy index entries | The legacy index is not universal |
| PKR | 12 data files and 12 schemas | Preserve Canonical Knowledge ownership |
| PWS Contracts | 10 frozen canonical JSON Contracts | Consume as upstream authority |

`content/registry/index.json` lists 48 of the 111 JSON files in its directory.
After excluding the index itself, 62 JSON files remain outside it. The added unindexed file is the frozen Master Governance contract. Many are
acceptance, milestone and implementation records added after the original
content index. This is a coverage gap, but it must not be repaired by treating
every audit record as a runtime Registry entry.

## Multiple-source findings

The clearest confirmed duplication is the Book Product definition, whose
commercial fields appear in both
`content/registry/book-products.json` and
`functions/commerce/book-product-registry.js`. Professional Service, Service
Level, Service Boundary, Offer, Revenue and Pricing concepts also span several
legacy static catalogs. Financial Registry JSON files identify their
JavaScript authorities, while External Reader JSON and JavaScript form a data
and validator pair; these pairs require reconciliation records, not immediate
deletion.

PWS-I2 must select one canonical write source for each relevant object family
and preserve compatibility reads until the owning migration step. A physical
duplicate is not automatically safe to delete, and an audit mirror must not be
promoted into another write source.

## W1 boundary

PWS-I2-W1 may establish the Universal Registry Core only after preserving the
following boundaries:

- Frozen Core Runtime registries and persistence remain their own authority.
- Existing four Migration SQL files and checksums remain immutable.
- PKR continues to own Canonical Knowledge Nodes and Supporting Questions.
- PWS-I1 canonical terminology, objects, states, operations, events, errors and
  directory ownership are consumed without redefinition.
- No legacy Service, Product, Offer, Price or specialist configuration is
  deleted or rewritten before its reconciliation step.
- Registry Read Models must not become customer Journey or Professional
  Workspace projections.

## W0 change scope

This step adds audit evidence and an automated baseline check only. It does not
change business code, Registry entries, persistence, D1, Migration SQL, page
behaviour or Production data.
