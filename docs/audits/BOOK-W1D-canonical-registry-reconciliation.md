# BOOK-W1D｜Canonical Registry Reconciliation

## Result

BOOK-W1D candidate preparation accounts for **716 existing Canonical Node Authority** records plus **2 KAU-R5 Human-accepted admissions**. It produces no active Canonical mutation because W1B is Human approved and W1C remains partially accepted.

BOOK-W1C now carries **323 upstream Canonical admission review candidates**: 192 promote, 66 link-to-existing, 21 supersede and 44 defer recommendations. The **213 provisional recommendations are TL-accepted**, while 110 recommendations remain pending. This W1D candidate records their upstream state but accepts 0 admissions and creates 0 new Canonical identities because W1C is not fully accepted.

The exact KAU-R5 718-node `nodes.json` remains byte-identical. There are **0 silent deletion**, 0 ungoverned nodeCode mutation, 0 duplicate active identity and 0 orphan migration entry.

## Reconciliation actions

- Every unchanged identity records `oldNodeCode == canonicalNodeCode` and `canonicalIdentityChanged = false`.
- W1B contributes 471 traceable `move publication ownership` candidate records for P8–P15.
- KAU-R4/R5 contributes two Human-accepted cross-Part rehome targets: `KN-B2-P7-052 → P11` and `KN-B2-P7-057 → P10`.
- The two physical rehomes remain unapplied because the target outline authority is not accepted.
- Five KAU-R5 deprecated identities remain governed legacy references; their nodeCodes are neither deleted nor reused.
- No outline chapter is converted into an approved Canonical Node, and no split, merge or new candidate is invented.

There are **473 publication ownership records** in total: 471 W1B ownership moves and two governed rehome targets. Every record contains old/new publication ownership, Part scope and a migrationRecord.

## Gate

This is candidate evidence only. **W1B is Human approved; W1C remains partially accepted.** Activation remains blocked until the four W1C successor Blueprints and the remaining 110 recommendation dispositions receive Human decisions. Only then may W1D Human Acceptance authorize a versioned Canonical Registry successor and publication-context application.
