# M3A-W1 Visual Acceptance Fixes

## Baselines

- Code baseline: `main` at `96f98c1e1d0c5395fb55f27e5a44ee8c3d9545b8`
- Production visual baseline: `ad5de1cd11a72ef71550d165d444436b81a99314`
- Audited pages: Home, About, Atlas, Entry, Reading, Navigation

## Closure

This patch adds a final compatibility stylesheet to the six audited pages. It:

- keeps skip links off-screen until keyboard focus;
- converts the Entry stage indicator to five bounded grid tracks;
- gives the Runtime sidebar an explicit high-contrast dark-surface palette;
- enforces a 44px minimum target on the audited compact controls.

The patch does not change Runtime JavaScript, APIs, storage keys, state,
element IDs, or translation keys.

## Verification

Run:

```sh
node scripts/check-m3a-visual-acceptance-fixes.mjs
npm run check
```

After deployment, repeat the six-page Production visual check at 360px,
768px, and 1440px. Confirm keyboard focus visibility and both UI languages.
Production visual acceptance remains pending until that read-only retest.
