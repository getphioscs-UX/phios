# PJA-W2E Production Tools

Status: `PJA-W2E-v1.0.0-Frozen`

## Purpose

PJA-W2E establishes a controlled bridge from Canonical Registry and Production
Readiness to an external draft package. It provides a Production Brief
Exporter, Package Validator and Safe Importer. A brief is an input snapshot; a
package is a draft production artifact. Neither is a new source of truth.

## Non-goals

W2E does not write article prose, create a Canonical Node, change a thesis,
approve or publish content, modify the Renderer, invoke a Provider, use Runtime,
make network calls, commit, push or deploy.

## Current State and Baseline Audit

- Node identity: `content/knowledge/registry/nodes.json`.
- Localization: `content/knowledge/registry/localized-content.json`.
- Node order: `content/knowledge/blueprints/book-1-knowledge-blueprint.json`.
- Supporting questions: Registry file with `questionCode`, canonical/source Node,
  locale projections, Source references and publication policy.
- Production Readiness: node-scoped files under
  `content/knowledge/editorial/readiness/`.
- Formal Schemas: Article v2, Claim, Source and Article Review under
  `content/knowledge/schemas/`.
- Renderer input: the Article JSON defined by Article v2; W2E sidecars are
  governance records and never a competing body source.
- Existing production articles: six flat locale/slug JSON assets.
- Existing Article Package/import pattern: none before W2E.
- Existing ZIP dependency: none. W2E uses a bounded built-in ZIP reader and
  Node's deflate support; no dependency was added.

## Architecture and Source of Truth

```text
Registry + Blueprint + Readiness + W2A–W2C Governance
  -> Production Brief (controlled snapshot)
  -> External Draft Package
  -> Structural and cross-file validation
  -> Dry-run plan
  -> Explicit atomic create in an allowed review root
```

Authoritative inputs remain unchanged. W2D remains the Renderer compatibility
authority. Validation never means factual verification or editorial approval.

## Directory Map and Generated Outputs

- Brief template:
  `scripts/lib/knowledge-production/canonical-article-production-brief.template.md`.
  The W2E audit selected the tool library because W2A freezes the existing
  `content/knowledge/editorial/` inventory; the template is non-authoritative.
- Shared implementation: `scripts/lib/knowledge-production/`
- Brief output: `dist/knowledge-production-briefs/`
- Validation report: `dist/knowledge-package-validation/`
- Import report: `dist/knowledge-package-imports/`
- Import destination pattern:
  `content/knowledge/articles/<locale>/<nodeCode>/`

The destination is used only in a specified `--target-root` during W2E. The
formal repository root is protected from `--apply`, and existing packages are
never overwritten.

## Production Brief Contract and Exporter Usage

The brief contains identity, localized identity, frozen thesis, article
boundary, W2A editorial rules, W2B structured Article rules, W2C
Claim/Source/Review governance, node inputs and the Package output contract.
Adapters select explicit fields; governance files are not copied wholesale.

```powershell
npm run knowledge:export-brief -- KN-PREFACE-001

code ".\dist\knowledge-production-briefs\KN-PREFACE-001-production-brief.md"

npm run knowledge:export-brief -- KN-PREFACE-001 --locale zh-Hans --json-report
```

The default locale is explicitly `zh-Hans`. The default output is
`dist/knowledge-production-briefs`. Existing output produces
`OUTPUT_ALREADY_EXISTS`; intentional regeneration requires `--force`.

`KN-PREFACE-001` is Production Ready. `KN-PREFACE-002` has no complete
Canonical Thesis or readiness:

```powershell
npm run knowledge:export-brief -- KN-PREFACE-002
```

Expected: `CANONICAL_THESIS_NOT_READY`, non-zero exit, and no partial output.
There is no title/question fallback and no cross-node thesis reuse.

## Package File Contract

Only these root-level files are accepted:

- `article.zh-Hans.json`
- `claims.zh-Hans.json`
- `source-dossier.zh-Hans.json`
- `review.zh-Hans.json`
- `media-brief.zh-Hans.json`
- `package-manifest.json`

The manifest lists the five content files and their SHA-256 over original
bytes; it does not checksum itself. Unknown, nested, executable and binary
files are rejected. Input bytes are preserved during import.

## Validator Usage

```powershell
npm run knowledge:validate-package -- KN-PREFACE-001 ".\incoming\KN-PREFACE-001-article-package.zip"

npm run knowledge:validate-package -- KN-PREFACE-001 ".\incoming\KN-PREFACE-001-article-package" --json-report
```

Directories and ZIP files are supported. Exit codes are `0` valid, `1`
validation failed, and `2` tool/input error. Reports separate errors, warnings
and informational findings.

Validation covers:

- exact file and Manifest contracts;
- formal Article, Claim, Source and Review Schemas;
- Media Brief strict shape;
- Node, locale, Previous/Next Node and readiness consistency;
- Claim/Block/Source, Review/version and Figure/Block mappings;
- forbidden status and executable-content scanning.

## ZIP Security

ZIP processing is bounded to 10 MB archive, 30 MB expanded, 50 files, 5 MB per
file and four path levels. Absolute paths, drive paths, `..`, duplicate
entries, symlinks, executable modes, encryption, unsupported compression,
nested files and unknown payloads are rejected. Content is decoded only inside
an isolated temporary directory, never the repository, and is deleted after
validation. Package files are never executed and `npm install` is never run.

## Importer Usage and Dry-run Policy

```powershell
npm run knowledge:import-package -- KN-PREFACE-001 ".\incoming\KN-PREFACE-001-article-package.zip"

npm run knowledge:import-package -- KN-PREFACE-001 ".\incoming\KN-PREFACE-001-article-package.zip" --apply --target-root ".\tmp\article-review"
```

The first command is always dry-run and writes no Article Package. It reports
CREATE/REPLACE/NO CHANGE/REJECTED planning plus protected paths. `--apply`
requires a separate `--target-root`; the formal repository root is not an
allowed W2E write target. All bytes are staged and a single directory rename
creates the package. Failure removes staging. Existing targets return
`TARGET_PACKAGE_EXISTS`; W2E does not invent overwrite or version semantics.

## Protected Paths

Registry, Blueprint, all existing Schemas, W2A–W2D Governance and Renderer
contracts are read-only. W2E's check compares their current SHA-256 against
`HEAD`. No package may write or propose changes to them.

## Status Boundary

Allowed package status: `draft`, `ready_for_human_review`,
`changes_required`. Forbidden: `approved`, `human_approved`,
`editorially_approved`, `publication_ready`, `published`.

`VALID` means only:

- Structurally Valid
- Governance-compatible Draft

It never means Editorially Approved, Factually Verified, Publication Ready or
Published.

## Error Codes and Failure Modes

Stable codes cover Node/locale/readiness failure, missing or unsupported
Schema, output collision, unsafe/oversized Package, Manifest/checksum mismatch,
Node/locale/status mismatch, Schema failure, cross-reference and Registry
relation failure, protected/existing target, invalid import and atomic write
failure. CLI output provides the code and a corrective hint without raw secret
data or default stack traces.

## Acceptance Result

`check:pja-w2e` executes both positive and negative Exporter behavior, five
valid package fixtures, Node/readiness/status/checksum/cross-reference invalid
fixtures, executable and symlink security cases, dry-run, atomic apply,
existing-target rejection and protected-file byte comparison. It runs after
PJA-W2D.

## Known Limitations

- W2E does not verify Source truth or browse the web.
- Package media contains briefs only; binary images are not accepted.
- The first version only creates a previously absent package. Updates and
  version directories require a later governance stage.
- Directly typing a `.md` filename in PowerShell treats it as a command. Open
  Markdown using `code`, `notepad` or `explorer`.
