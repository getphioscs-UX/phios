# M1-W6 Full Journey Acceptance

## Release candidate

`runtime-engine-v1.0.0`

M1-W6 executes three bounded fixtures through Entry, Reconstruction, Return to Entry, Edit, Reading, Navigation, Review, Memory, and Continuity. Memory and Continuity remain contracts inside the existing My Reality Runtime Workspace; this acceptance does not add separate Runtime pages or stages. It uses four language scenarios and freezes the responsive acceptance widths at 360px, 768px, and 1440px.

## Fixtures

| Fixture | Boundary under test |
| --- | --- |
| A — Money Fear | Financial evidence, fear as reported experience, and observable spending behaviour |
| B — PHI OS Career | Professional identity, family constraints, long-term direction, and sustainability uncertainty |
| C — Relationship Change | Multiple people, expression withdrawal, relationship evidence, and observable action |

## Language matrix

Each fixture runs with English UI and English input, Chinese UI and Chinese input, Chinese UI and English input, and a language switch after the session begins. Language switching must preserve the stored Reality while changing customer-facing Runtime copy.

## Responsive matrix

The automated acceptance verifies that every Journey page carries responsive viewport metadata and remains within the shared responsive source contract. After deployment, the same three fixtures must be visually inspected at 360px, 768px, and 1440px before the Git tag is created.

## Release rule

The automated suite produces a release candidate, not the Git tag. Create `runtime-engine-v1.0.0` only after the deployed build passes the visual interaction checklist at all three widths. The tag must point to the exact commit that passed `npm run check` and deployed acceptance.

## Deployed visual checklist

- No horizontal overflow or obscured primary action.
- Entry history remains visible after Return to Entry and Edit.
- Reconstruction source edit controls are reachable.
- Reading loading state clears and all customer fields render.
- Navigation shows Reading provenance and Evidence → Action.
- Continue to Review navigates successfully.
- Review, Memory, and Continuity preserve the same Runtime identifiers.
- UI language can change without translating or deleting the user's stored source evidence.

After all items pass, change the acceptance registry status from `candidate` to `passed`, set `tagCreated` to `true` in the tag commit, and create the annotated release tag.
