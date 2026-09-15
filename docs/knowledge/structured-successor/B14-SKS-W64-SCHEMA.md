# W64 schema checker on da0b0a6

The common schema checks objectId, bookCode, partCode, nodeCode, title, objectType and sourceRefs across all four registries. Book-specific extension fields retain their existing contracts; this common schema deliberately does not invent definitions or force Book II–IV through the Book I complete-definition contract.

The checker verifies 71 unique objects, exact discovery/backlink membership, registry path and book ownership, current Part ownership, existing canonical nodes, manuscript section membership/Part/hash, article backlinks, figure existence and related-object references. Legacy node prefixes are not treated as book ownership: Book II still has valid KN-B1 identifiers. Source digest and candidate reconstruction checks run before corpus validation.

Twelve in-memory negative cases cover missing title, malformed/orphan identity, wrong Part, dangling section/node/article/object/figure refs, missing backlink, duplicate discovery/object IDs and altered section hash. Inputs are cloned; production registries and source snapshots are never rewritten by the checker.

Run npm run check:b14-sks-schema. W65 remains the separate authority-policy gate; this stage does not establish semantic correctness or human acceptance. Forty missing meanings remain extraction gaps. Next W65.
