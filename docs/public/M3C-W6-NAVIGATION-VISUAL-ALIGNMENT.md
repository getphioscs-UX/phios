# M3C-W6 · Navigation Visual Alignment

## Outcome

Reality Navigation now presents the frozen Navigation result through six
explicit customer views:

1. **Available Direction** — all contextual bounded paths that remain
   available for user choice;
2. **Reason** — the current Runtime, transition and reason that make the paths
   relevant;
3. **Evidence** — observable signals that may confirm or change the current
   path;
4. **Constraint** — active constraints and Unknown Reality that remain open;
5. **First Action** — the first step from the path selected by the user;
6. **Review Point** — the conditions for reading the same Runtime again,
   including the existing Professional Review boundary.

The header now shows the full seven-stage Runtime Journey.

## Choice and action boundary

The customer projection is read-only. It does not select, execute or rank a
path and does not prepare Review. Before the user selects a path, **First
Action** remains pending. After selection, it displays only the `firstStep`
already present in the selected frozen Navigation path.

The existing path-selection module continues to own session persistence,
Change Path, professional consent and Continue to Review. No automatic final
decision is introduced.

## Verification

```powershell
npm run check:m3c-navigation-visual-alignment
npm run check
```

After deployment, verify `/reality-navigation.html` in English and Chinese at
desktop and mobile widths. Confirm no path is selected automatically, First
Action is pending before user choice, selecting and changing a path still
works, and Review remains blocked until its existing gate is satisfied.
