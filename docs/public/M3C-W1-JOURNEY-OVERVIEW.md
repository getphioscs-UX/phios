# M3C-W1 Reality Journey Overview

Baseline: `b5ac9b188d3bd065575551cbf4d7573f14099c98`  
Public route: `/reality-journey`  
Start route: `/reality-entry`

## Install

Extract the delivery ZIP over the repository root and allow the included files
to be added or replaced:

```powershell
Expand-Archive `
  ".\PHIOS-M3C-W1-Journey-Overview-2026-07-23.zip" `
  -DestinationPath "." `
  -Force
```

## Scope

M3C-W1 adds the public explanation layer for the existing seven-stage Runtime
Journey:

1. Entry
2. Reconstruction
3. Reading
4. Navigation
5. Review
6. Memory
7. Continuity

The page explains the role, customer action and protected boundary of each
stage. It does not change a Runtime contract, schema, migration, D1 binding or
stage implementation.

## Public boundary

The overview page:

- does not create a Runtime;
- does not call a Runtime API;
- does not store Journey content;
- may remember the existing interface-language preference only;
- links the primary action only to the canonical Entry route;
- keeps the lightweight no-save Demo available as a separate option.

## AI and privacy

The page states that AI is assistive rather than authoritative, Provider output
does not become observed evidence, uncertainty remains visible and PHI OS does
not provide medical diagnosis, legal advice, financial recommendation or
emergency response.

## Verify

Run from the repository root:

```powershell
npm run check:m3c-journey-overview
npm run check
```

After deployment, open:

```text
https://phios-github.pages.dev/reality-journey
```

Confirm:

- the public Reality Journey navigation opens the overview;
- all seven stages are visible in English and Chinese;
- Start Reality Journey opens `/reality-entry`;
- the Demo link opens `/reality-demo`;
- the privacy, AI disclosure and professional-boundary links work;
- the layout remains readable at 360px, 768px and 1440px.
