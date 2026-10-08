# CPR historical source drift

Actual: 52f013d7f6f2b81c9204611df1b20937335133d2b17ddc10830d5e91dc062742
Frozen expected: 49b4993a75c19cb3f4dab6baf392da81dbb2eb0e00aa6983681667a471b4a9b0

Checker: scripts/check-cpr-w0-w6-presentation-foundation.mjs line 21 compares all historical source-system bytes. This is a real registry byte change, not a Node JSON import incompatibility.

Recent source history:

4dca5a6c book1: reconcile final R2 public asset prefixes
3690526e B6-WEB-F admit live-verified Book VI figures
aca0044f B6-WEB-F reconcile Book VI figure delivery paths
f9682103 H.5&H.5A

Commit 4dca5a6c changes registry_version 1.2.0 to 1.2.1, Book I figure prefix images/figures/book-1/ to images/figures/books/book-1/, adds the owner-reported date and 4A–4F set. Earlier Book VI admissions also changed this registry. This program has not changed registry or frozen CPR evidence.

Classification: BASELINE_EXTERNAL, unresolved. Impact: CPR foundation/global machine admission cannot claim PASS. This does not independently prove a customer rendering defect; current Pages and affected route checks are separately recorded. An independently authorized successor reconciliation is required; frozen digests were not rewritten.
