# M2-W8 Security and Privacy

## Frozen classification

Runtime data uses five classifications:

`public`, `private`, `sensitive`, `professional`, and
`research-consented`.

The default is `private`. Public status requires an explicit owner-approved
publication decision. Research consent changes the permitted use of named
Runtime records; it does not make those records public.

## Sensitive logging

Runtime services must use the Privacy Logger for operational records. Answer
text, conversations, state, payloads, snapshots, revisions, contact details,
credentials, financial information, and medical information are replaced by
`[REDACTED]`. Logs may retain bounded operational metadata such as operation,
status, stage, event type, count, request ID, and duration.

## User-controlled lifecycle

Every destructive or export operation requires `user_initiated: true`.

- Session deletion requires the active Session Store and verifies ownership.
- Runtime deletion verifies ownership and uses the existing D1 cascades.
- Account deletion requires the exact `DELETE_ACCOUNT` confirmation token,
  deletes every owned Runtime, then calls optional Session and Identity stores.
- Data export includes only the requesting owner's Runtime records, Events,
  latest Snapshots, Revisions, and Lineage links.

No old Migration is changed by M2-W8.

## Professional Access Boundary

A professional never receives automatic access to the user's account. A valid
grant must identify the professional, purpose, consent version, and each
permitted `runtime_id`. Wildcard or user-wide grants are rejected. Revoked or
expired grants are rejected.

## Research Consent Boundary

Private Runtime data is excluded from research and Community use by default.
Valid research consent must name every permitted `runtime_id`, its purpose,
consent version, and current granted state. Withdrawal immediately invalidates
the permission. Research consent does not imply public publication.

## Verification

```bash
npm run check:runtime-security-privacy
npm run check
```
