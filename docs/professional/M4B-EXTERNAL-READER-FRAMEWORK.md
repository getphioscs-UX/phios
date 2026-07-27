# M4B External Reader Framework

M4B now uses one External Reader Framework instead of a Human Design-only
implementation. Human Design is the first populated Registry. BaZi, Zi Wei,
Gene Keys and Astrology use the same schemas, directory topology,
localization model, adapter boundary and Professional Workspace projection,
but contain no interpretation entries at this stage.

## Bilingual Registry

The Human Design Registry cross-references `Human Design Summary(3).xlsx`
and `人类图总结(2).xlsx`. Neither workbook is authoritative by itself.
Each Registry entry records the English and Chinese source locations, then
provides independently rewritten PHI OS Runtime Language, Professional Notes
and Interpretation Boundary fields for `en` and `zh_Hans`.

The Registry does not copy the source workbooks into the repository and does
not reproduce their long explanatory paragraphs. Source files remain source
material only.

## Shared infrastructure

The framework defines one reusable Registry Entry, Reader Registry, Category,
Source Label, Birth Data, Chart Upload, Normalized Chart, Interpretation,
Correspondence, Reader Adapter and Registry Version structure. A new Reader
plugs into the same Registry and Workspace projection without changing
Runtime Reading, Reading Contract, Navigation Contract or Customer Journey.

The chart flow is intentionally limited to:

```text
Shared Birth Data or Uploaded Chart
  → Reader Adapter
  → Normalized Chart container
  → Registry lookup
  → Professional Interpretation draft
```

No adapter performs automatic chart calculation, automatic chart rendering
or automatic report generation.

## Runtime boundary

Reality Reading remains primary. External Readers are secondary,
interpretation-only perspectives. They cannot generate or overwrite Runtime
Reading, modify Runtime Evidence, write Runtime Memory, replace Professional
Review or create a required Navigation action. A supported correspondence
must reference Runtime Evidence and remains a separate correspondence object.

## Professional Workspace

The Professional Workspace adds a generic External Reader Workspace view.
It renders only a prevalidated, consent-gated in-memory projection. It does
not call an API, inspect browser Runtime storage, persist client data or bind
the page to any Reader-specific chart structure.
