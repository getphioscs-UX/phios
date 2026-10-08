# PHI OS Production Closure baseline

Work: PHI-OS-PRODUCTION-CLOSURE
START_HEAD: 89ca64a26935e7679a14f5072e86f3690188800b
Branch: main
UTC: 2026-10-08T07:57:24.707Z
Node: v24.18.0
NPM: 11.16.0
Production URL: https://getphios.com
Canonical domain: getphios.com
Cloudflare project: phios-github

This is a recorded local baseline, not a production deployment or remote freeze. New master PC-W0–31 is separate from previous PC-R1 scopes. Existing accepted work is inherited.

## Bindings and environments

{
  "r2": [
    {
      "binding": "MANUSCRIPTS",
      "bucket_name": "phios-private-manuscripts"
    },
    {
      "binding": "PRIVATE_REPORTS",
      "bucket_name": "phios-private-reports"
    }
  ],
  "d1": [
    {
      "binding": "RUNTIME_DB",
      "database_name": "phios-runtime-production",
      "database_id": "073639fa-01e4-4868-af10-6ed032637dab",
      "migrations_dir": "db/migrations"
    }
  ],
  "qaStripe": "QA",
  "qaAuth": "auth0"
}

Production Stripe and Auth values are unverified; QA configuration is not proof of production environment. No secrets copied.

## Pre-existing worktree changes

- M  ontent/professional/ast-full-production/publication/r1r2/publication-snapshot.json · directory or unavailable
-  M content/professional/ast-full-production/publication/r1r2/zero-cost-check-receipt.json · f5f89f5162923121a50ff9a44cddac461a5808141bbae907192473f06b209ffe
-  M functions/ast-full-production/ast-vfr-r1r2-diagram-system.js · 882741665134e6c56c2f599b8875405a88aabea6ce3c780ae2781814f4457f0a
-  M functions/ast-full-production/ast-vfr-r1r2-renderer.js · 8c1a9529fc3179b3f650c009f25cfc8db656da6b2ed9dd408db4b6ba256c470e
-  M tools/review/AST-VFR-R1R2-P027.png · c70255e9942ce08e6591cae947b0b458b6d7fb92061c87acef4fd66ad39c4810
-  M tools/review/AST-VFR-R1R2-P031.png · ed950b18dbd0bcaa56e316d6cb3628ee7df5f9f64ec3c2d6eae22bd8d79154e9
-  M tools/review/AST-VFR-R1R2-P035.png · 182b43070ef22432354bb0195af5929ffddb95b93df125394803a2d953cc7d5c
-  M tools/review/AST-VFR-R1R2-P039.png · c544ee278960e85cc21c50584107d265b78d8e0039a2d217b1bd38a594c0109c
-  M tools/review/AST-VFR-R1R2-P051.png · 60bdaab3d49ac3e3c9dd5f97e328676743528f5abe29672bd7929f84dd074c0c
-  M tools/review/AST-VFR-R1R2-TL-PUBLICATION-REVIEW.html · 6478e16e3e93bde5566efb2de0397578e87ac03b09b08a9bf30927f5cf707c02
- ?? content/product-convergence-r1/acceptance/ · directory or unavailable
- ?? content/product-convergence-r1/audits/personal-relationship-targeted/owner-acceptance/ · directory or unavailable
- ?? content/professional/ast-full-production/publication/r1r2/glyph-coverage-receipt.json · 96acac70f2a92903721ec0b7555b35773ada10d0c7a2038cb58f2c8d7bb55587
- ?? content/professional/ast-full-production/publication/r1r2/pdf-content-receipt.json · ccc9f2cfc91796cb6ef61d778de181d24d00ff128636986c874bb9158fcc1be5
- ?? content/professional/ast-full-production/publication/r1r2/pdf-print-receipt.json · f2fc0372c71c050e6a1e4278cf13bce9d0cbb99fed0cbf537289140fb5a93d72
- ?? scripts/prepare-production-closure.mjs · 6b9f789182407fd56597515b225205876ad152a7fe41e41f76bfc3b8d979fbaf
- ?? scripts/record-pc-w92-w93-targeted-owner-acceptance.mjs · a5ec2c6805b630689c032c44b34418715fbbf86f5a9f08276c6818ad4a90329c
- ?? scripts/run-production-closure-command.mjs · 7e47745e3c9a2112881a568b8fefedf4f6a7dbe3436c18de54c71e6dd1ef4a93
- ?? scripts/verify-ast-vfr-r1r2-pdf.py · f054b10713fe44fc82afc3be1f6f230a851276bd2b1dc2af9bb1a5d03dd891db
- ?? scripts/verify-ast-vfr-r1r2-print.mjs · 113aaa123da2b77c514b987ecc8c3287c700dfb9be9cc5cb716410f6e76f9616
- ?? tools/review/AST-VFR-R1R2-PRINT-AST-D01.png · 54d09693839bbed4709b5943a54d5e61ea764d49ec3ad87e17e420e77e9e1d1e
- ?? tools/review/AST-VFR-R1R2-PRINT-AST-D06.png · 24d84925edf03ff4538c2a44b4c1eae1a4c0f8c46bcc075840e351a2f446cbff
- ?? tools/review/AST-VFR-R1R2-PRINT-AST-D11.png · 5570b8bc739311858f3d62a4234b913b875a4432a3c88c743d549cdbf726e197
- ?? tools/review/AST-VFR-R1R2-PRINT-CONTACT-1.png · d3f871c321d95ba58c2979ad5f78c2dfb30f1ddc0c063edf70c7b3bb3bc75410
- ?? tools/review/AST-VFR-R1R2-PRINT-CONTACT-2.png · 0128d0fb3c69832faf638106611843a23224f26737f5dd33032001c946bd1dbd
- ?? tools/review/AST-VFR-R1R2-PRINT-CONTACT-3.png · baa51d86364c693ab624ca6b640a58f3a89d29709f27e777bc5fed6addc00a40
- ?? tools/review/AST-VFR-R1R2-PRINT-CONTACT-4.png · 5e935fbe6bdeae65a0be2591e22a287513c625d21c89873fe7c232881709e8c9
- ?? tools/review/AST-VFR-R1R2-TL-PRINT-REVIEW.pdf · 5be78415e78d3cb745acf040256bdf1efd38a45b08e11f22286866c001fbf30b

Full snapshot and 172 protected current hashes: content/production-closure/baseline.json. No reset performed.
