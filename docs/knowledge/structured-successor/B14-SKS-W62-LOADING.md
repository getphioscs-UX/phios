# W62 progressive registry loading

Implemented on 22d8cca. Public Explorer mounts and source backlinks use the generated loading manifest. Four initial requests follow manifest → book identity/title directory → active family → selected object. Object payloads preserve source fields, detail, and backlinks. The projections create no authority. Content-addressed book/family/object paths avoid mixing payload versions when the manifest changes.

The four existing complete reading-map/comparison renderers remain available through an explicit “Open full reading map and comparisons” button. That action intentionally loads the active book's complete reading data. Default views and closed source backlinks do not load every Book I–IV object. Related topic buttons request their destination only when clicked. In-family search applies to loaded titles; full-text indexing is W63.

The loader shares in-flight requests, caches successful data, evicts failed requests for retry, bounds fetches to 12 seconds, and rejects unknown book/object scopes. View revisions ignore stale selection results; disposal removes handlers. The default-topic initial JSON totals are Book I 7,842 bytes, Book II 6,337 bytes, Book III 8,183 bytes and Book IV 9,141 bytes. These are local uncompressed projection bytes, not deployed transfer or latency measurements.

Validation: check:b14-sks-loading (projection reproduction, request order, concurrent reuse, retry, scope rejection); optional --browser (four live mounts, four initial JSON requests, lazy selection and history cache). Existing 32-case full reading component suite passed. No new full paid journey or production performance acceptance is claimed. Forty unresolved definitions and consolidated human review remain open. Next W63.
