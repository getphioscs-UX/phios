# Shared commerce patch contract

Base: remote main 60e2a4d0aad747e82fd3b63d58b06dbf1586306c. Implementation belongs only to this task's new isolated worktree. The dirty root checkout and Pre-Entry source are not patch targets.

- Existing GET /api/commerce-catalog gains an additive `fullReportCapability` on the five canonical Full Report products. It exposes method/product identity, existing native owners, declared publication metadata, required input categories, shared admission, setup/account destinations and precise blockers. It grants no entitlement and contains no personal data.
- Existing `paidReportSetup` is retained with its existing flag semantics. Existing clients can ignore the new field.
- For these five products only, a NEW Checkout requires the existing shared setup flag, admitted executable lifecycle, and the existing server readiness check. An off flag cannot bypass the readiness guard. No price, language quote, account identity, webhook or entitlement owner is replaced.
- Books, subscriptions, bundles and other service/report products retain their current behavior. Issued artifacts and historical downloads remain under their existing owners.
- BZR is evaluated independently. ZWR is not admitted by this change. AST/NUM/HD native implementations are acknowledged without registering unverified production adapters or promoting local-only Numerology replay.
- No Pre-Entry page, CSS, visual registry, figure, screenshot or customer copy is edited. The other window may consume the additive field after a separate integration review.

This contract is written before the shared commerce source patch. Do not copy a whole shared file over another window. Review the isolated diff against the then-current main.

## PDF delivery successor
The existing BZR verifier currently discards the PDF and the existing account method endpoint downloads HTML. This task adds a private `/pdf` renderer mode using the same publication/fit checks, caches the byte-identical derivative under the existing customer artifact store/state/lock owner, and adds authenticated `format=pdf` on the existing method report route. Every read rechecks the exact original purchase/entitlement and subject permission. Existing HTML and historical report identity remain unchanged. No new storage table or engine is introduced. The worker protocol and route require cloud QA and deployment approval before release. Account UI integration, if needed, is supplied as a compatible small patch; Pre-Entry remains untouched.
