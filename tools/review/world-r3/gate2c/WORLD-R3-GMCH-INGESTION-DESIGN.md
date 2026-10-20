# Ingestion design · NOT_STARTED in production
Reuse World/current-facts source owner and existing public article resolver. This review registry is an audit artifact, not a second runtime authority. First MY/US narrow adapters only after Gate3 acceptance.

Official API preferred; documented CSV/XLS next. PDF only when necessary with page/sample checksum. Save raw immutable source/version/checksum and response metadata; normalized observations reference raw row/cell/table, definition, original unit, population, publication and observation time. Never let raw storage read from a derived answer. Canonical owners must approve D1/R2 writes before any migration design becomes implementation.

Normalized revision history feeds a read-only time-series query and answer evidence layer. Exact same-period requests fail visibly if missing; no silent fallback to latest. Mechanism retrieval uses admitted paragraphs, their version SHA and permitted excerpts. Source licence/scope changes invalidate future consumption without rewriting historic receipts.

No scheduler installed. Planned per-source cadence: decisions for policy rates; businessday provisional/final marketrates; monthly BNM/BoE credit and DOSM CPI; surveyquarter SLOOS/BLS; annual HMDA and surveyincome; quarterly BIS per publisher calendar. Release calendars/holidays are source-specific outstanding configuration.
