# PDS-W10｜全站验收与交付

Baseline: `main@1daa1bb7c3a379e77c866a6532cdc56fdd4dc027`.

W10 closes presentation-level accessibility gaps found during production
sampling: Reality Review and My Reality now provide bilingual Skip Links with
valid main targets; touch-sized layouts enforce the 44px control contract; and
Public Footer metadata links expose a 44px interactive height.

The acceptance matrix covers 360px, 768px and 1440px; English and Simplified
Chinese; keyboard and visible focus; touch targets; horizontal page overflow;
loading, empty, failure, blocked and recovery states; PHI OS page console
errors; Runtime freeze tests; and the complete repository check.

## Current gate result

- `npm run check:pds-w10`: passed locally.
- Production W9 presence: confirmed at `https://phios-github.pages.dev/`.
- Sampled production pages: no page-level horizontal overflow and no PHI OS
  page console errors at the available 1363px browser viewport.
- Full Production W10 matrix: requires revalidation after this delta is
  committed, pushed and deployed.
- The Runtime migration registry blocker was resolved in PWS-W0 by registering
  the existing immutable `0004_book_commerce.sql` migration with its canonical
  checksum. No migration SQL or frozen Runtime principle changed.

The mismatch was the pre-existing `runtime-migration-registry-count` blocker
recorded in PDS-W0. Its governance closure does not change the Runtime SDK,
providers, contracts or storage behaviour.

Run:

```sh
npm run check:pds-w10
npm run check
```

After deployment, repeat the complete Production matrix at all three viewport
widths and in both locales. The final result is determined by the most severe
open gate; build success alone is not a Passed result.
