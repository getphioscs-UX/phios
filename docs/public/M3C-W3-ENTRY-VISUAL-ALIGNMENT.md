# M3C-W3 · Entry Visual Alignment

## Outcome

Reality Entry now follows the M3 public experience system for:

- Header
- Spacing
- Buttons
- Cards
- Typography
- Seven-stage progress
- Error states

The page remains a focused Runtime workspace. It does not use the public
marketing shell because Entry is an active customer Journey stage.

## Frozen behavior

This milestone does not change:

- `phi-os.runtime-entry.v1`;
- the Runtime Entry request or response contract;
- `/api/reconstruct-reality`;
- Evidence Depth rules;
- Entry session keys;
- page-refresh recovery;
- correction and clarification behavior;
- Continuity initialization;
- the explicit transition to Reality Reconstruction.

The new stylesheet is loaded after the earlier visual-acceptance layer and is
scoped to `.entry-workspace-page`.

## Error treatment

An empty response now exposes the existing validation message as a visible
error state and sets `aria-invalid` on the textarea. A provider or network
failure remains outside the model conversation, but is rendered as a
distinct, accessible error message. Retrying keeps the existing Entry state.

## Verification

```powershell
npm run check:m3c-entry-visual-alignment
npm run check
```

After deployment:

```powershell
Start-Process "https://phios-github.pages.dev/reality-entry"
```

Visually confirm English and Chinese at desktop, tablet and mobile widths.
