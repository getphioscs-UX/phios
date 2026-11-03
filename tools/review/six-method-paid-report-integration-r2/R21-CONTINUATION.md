# R2.1 local continuation — environment blocker

NUM now has a read-only existing Account API bridge over the existing Job/material/private object owners. Its R30 replay scope remains local QA and p8Admitted=false. No generation route or public purchase enabled. Material now captures exact entitlementId; expired entitlements and wrong checkout owners are denied.

One actual memory-only path passed: QA seeded purchase → native NUM calculation → automatic shared Scheduler → existing source-bound PDF → existing Account API → equal download/redownload/reopen. Five access/receipt negatives passed. PDF: 29,996,100 bytes; SHA e79e9e0cc92631d1402a6056fd2c1922ec11503b90e36cfe16ed27ff4d6e0827. See R21-NUM-MEMORY-ACCOUNT-QA.json for exact identity tuple.

Disk-backed run FAILED with ENOSPC and correctly entered AUTOMATIC_RECOVERY. C: free space measured 0. No durable storage or cold-process PASS is claimed. No cleanup was performed. Small source/evidence writes succeeded but larger PDF writes failed; pause further artifact generation until Owner frees space or authorizes another local directory.

BaZi historical replay IR has fixture=true/reviewOnly/customerPublishable=false by design; it cannot be silently promoted to customer publication. Same-file automatic native delivery remains unproven. ZWR full same-file lifecycle remains unproven. AST adapter and material owner, HD Full17 admission/adapter, and ECR customer-ten-chapter source/adapter remain open. Prior accepted evidence is preserved.

All six: SANDBOX_E2E_PASS=false; OWNER_CANARY_READY=false. Existing signature/publication decisions remain required. No cloud, payment, Provider or production action. Provider Calls=0 / USD0.

Next: restore local disk capacity; rerun only the newly failed NUM durable test, add cold-process reopen; then BZR/ZWR exact-file lifecycle and remaining real source-owner adapters. Do not repeat accepted render/visual tests.
