# W69 cross-book checker on d09f7d4

Run npm run check:b14-sks:cross-book. The current-stage entry reuses the existing source-backlink checks plus W60 dedup, W61 conflict and W66 relationship checks. Imports are sequential in one Node process; --record is rejected so earlier acceptance stages cannot be rewritten.

Additional checks enforce the expected Book I–IV Explorer route and selected-object query parameter on both discovery and backlink records. The Book IV–V bridge must preserve its source set, Book IV owners and Book V Atlas destination. It cannot copy the Book V registry, write Atlas, create historical claims or grant itself human acceptance.

All 71 objects and one bridge passed. Eight in-memory negative mutations reject wrong-book routes, wrong object parameters, owner mismatch, bridge destination drift and four authority promotions. Existing 2,485-pair dedup and conflict/relationship regressions also pass.

Zero semantic edges, two pending reading suggestions and five unconfirmed dedup/conflict clues remain unchanged. Forty meaning candidates have passed source verification but await consolidated semantic review and versioned import; live null definitions remain unchanged. This is machine consistency validation, not human or production acceptance. Next W70 Ask Checker.
