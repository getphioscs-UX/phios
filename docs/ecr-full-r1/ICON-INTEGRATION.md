# ECR / Profile icon integration follow-up

User-authorized extension on baseline `1046e1ee66db5403142c76f6754729de36d37ce7`.

Registered the two supplied SVGs as `CXICON-METHOD-ECR` and `CXICON-METHOD-PROFILE` in the existing active customer visual registry v3, with local URLs and SHA-256 checksums. Extended the existing icon reconciliation contract to v1.1.0; the archived v2 asset projection remains unchanged. No new asset resolver, method identity, calculation or entitlement owner was created.

Personal Reality now uses the ECR icon in its method introduction and selectable ECR card, and the Profile icon in its optional Profile entry. The Profile page uses its icon beside the hero introduction. The supplied SVG artwork is unchanged. Icons are decorative beside existing text labels and use the existing hydration path.

The original fixed count of seven method SVGs is replaced by exact file-set equality against the existing reconciliation inventory. The check also validates unique IDs, active-registry URLs, availability, file digests and both new page bindings. This retains missing/unregistered-asset detection while admitting the nine registered icons.

Registered the changed Personal Reality page in the existing current shared-owner registry, retaining its predecessor digest and replacing the superseded ECR Logo token requirement with explicit ECR/Profile asset bindings. No historical freeze was rewritten. Shared-owner 14/14 checks and Zi Wei W15/W16 integration passed after this reconciliation. `icon-review-revision.json` binds final human review to the actual changed files.

Validation: `node scripts/check-cx-r12r4-personal-reading-experience.mjs` passed. Eight local headless Edge cases passed: Personal Reality and Profile, actual en/zh-Hans locale state, 390/1440 pixel widths. Every new icon loaded with nonzero intrinsic dimensions and visible layout; no horizontal page overflow. Remote assets were blocked in this local icon-only test, so unrelated remote header artwork is not validated. Browser results are in `icon-browser-results.json`.

This supersedes the SVG-count blocker recorded in the earlier DELIVERY.md and check-results.json. Those files retain the historical run result. The follow-up full check is recorded separately in `verification-summary.json` and its linked full-check logs; consult its outcome before claiming full repository PASS. Human visual approval remains PENDING in FINAL-REVIEW.md together with PIS-R1. No production deployment or ECR-FULL-R1 semantic admission is implied.
