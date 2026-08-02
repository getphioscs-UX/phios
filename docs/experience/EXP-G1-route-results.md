# EXP-G1 Core Public Experience Route Results

Baseline: `d7b5a9f57193935a3759c20a0dfc33a773a743a4`  
Production: `https://phios-github.pages.dev`  
Checked: 2026-08-02

EXP-G1 rechecks 11 named surfaces: 10 active customer surfaces and the retired Demo redirect. Memory and Continuity remain distinct customer states in one `/my-reality` document. Demo is not restored, scored or counted as an active page.

| Surface | Production route | Result | Production evidence |
|---|---|---|---|
| Home | `/` | Pass | HTTP 200; SHA-256 `5a5b3e558234859b7379fb7577411a93c5ad3279e5c2ec63fee46964a5305953`, identical to current `index.html`; browser exposed one Reality Journey primary action. |
| About | `/about` | Pass | HTTP 200; SHA-256 `8cd6da3c7dc3c92228008710de82991245e6a041c87e31d4ee8ea72a55e5f0e6`, identical to current `about.html`. |
| Reality Journey Overview | `/reality-journey` | Pass | HTTP 200; SHA-256 `b8e7cfddf745f0ac2ccd28a68e1b0fc94103e95a03959e94a3f42423aededfa1`, identical to current page; one visible “Start a new Reality Journey” primary action. |
| Demo | `/reality-demo`, `/reality-demo.html` | Retired-route Pass | Both return HTTP 308 directly to `/reality-journey`; no redirect chain and no active Demo UI. |
| Entry | `/reality-entry` | Pass | HTTP 200; SHA-256 `1d4c5ccd9e756f9f628e1abef66016c95c9c98aeae1f85af0108b26f598f2308`, identical to current `reality-entry.html`. |
| Reconstruction | `/reality-reconstruction` | Pass | HTTP 200; SHA-256 `ed95044243f77674dc37a0182d95970dbc6d9ae7431e64a8a2baba7534a09240`, identical to current customer projection. |
| Reading | `/reality-reading` | Pass | HTTP 200; SHA-256 `b5eb2e903ea29d268c81656e4dae90e5c27feee2b9a72f0791a51a0131b47448`, identical to current value-reveal projection. |
| Navigation | `/reality-navigation` | Pass | HTTP 200; SHA-256 `8eb829d1247f132ef5987d8712120fbbaa5eac315e34a131d5d526dfa6b32c04`, identical to current task-separated projection. |
| Review | `/reality-review` | Pass | HTTP 200; SHA-256 `5f219f846bc97087c4a66a6efbf79b57d87c32f894fca1cd337f0e1811604512`, identical to current task-separated projection. |
| Memory | `/my-reality` → `#memory` state | Pass | HTTP 200; SHA-256 `dc18cc4c3c68bac79d847b215f08e9f1072049665f153f0ac8ef7a12e800116a`, identical to current `my-reality.html`; `/my-reality.html` normalizes with HTTP 308 to `/my-reality`. |
| Continuity | `/my-reality` → `#continuity` state | Pass | Same deployed document hash; Memory and Continuity retain separate headings, choices and primary responsibility. |

The live M3C Production script passed all eight Journey routes and nine critical assets after its obsolete pre-EXP-W3 `stage-entry` marker was replaced by the current Overview contract marker `journey-flow-title`. This repairs an acceptance assertion only; Production and page behavior were not changed.

The original EXP-W0 route inventory, 19 audited surfaces, 18 unique routes and Failed result remain historical and unchanged.
