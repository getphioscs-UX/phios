# Install

Copy the contents of this folder into the repository root:

C:\Users\Guest Account\OneDrive\Desktop\PHIOS\phios

Allow replacement of:

content/knowledge/blueprints/book-1-knowledge-blueprint.json

Then inspect:

git diff -- content/knowledge/blueprints/book-1-knowledge-blueprint.json
git diff --check

The delta changes `titleZhHans` only. It does not modify Node Codes, Mapping ranges, Section Hashes, Inventory, Manifest, R2 objects or manuscript content.

Before continuing P1 Mapping Review, remove the unapproved temporary P1 review file and regenerate it from the updated Blueprint:

Remove-Item ".\.tmp\knowledge-manuscripts\book-1\p1-node-mapping-review.json" -ErrorAction SilentlyContinue
npm run knowledge:manuscript:generate-map-p1 -- --dry-run

If P1 candidates were already generated from the previous title set, do not manually edit persistent Mapping JSON. Revert/regenerate the P1 candidate round through the repository's controlled command or provide the resulting status output for the next repair step.
