# Validation and screenshot retention policy

Only failed cases create diagnostic screenshots. Four representative final screenshots cover 1440/390 × English/Chinese. Full successful case matrices remain JSON, not per-case images.

Results are reusable only when the complete dependency, fixture, checker, runtime environment and local asset-cache hash manifest matches. Changed or missing dependencies require a rerun. A change during a run marks the receipt PARTIAL, even if individual cases passed.

Final module captures hide the fixed shell header and focus-only skip link during image capture, preventing fixed viewport controls from covering the long element screenshot. The actual customer page remains unchanged; the header logo still must load and decode during every browser case.

Original screenshot inventory is an as-of baseline, not a current rolling count. Archive and deletion lists remain REVIEW HOLD until exact consumer, acceptance ownership and restore evidence is closed. No cleanup was executed.
