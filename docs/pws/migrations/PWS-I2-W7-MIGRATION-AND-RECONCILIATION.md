# PWS-I2-W7｜Migration and Reconciliation

## Outcome

PWS-I2-W7 reconciles the legacy professional, commercial and knowledge
configuration into the PWS Universal Registry without deleting the existing
read paths or creating a second Knowledge authority.

```text
Legacy read compatibility
↓
Explicit canonical mapping
↓
Idempotent Registry population
↓
Conflict-closed verification
```

## Migrated boundaries

| Legacy scope | Canonical treatment |
| --- | --- |
| `ServiceProduct` | `Product` with a required `Service` reference |
| `ServiceEntitlement` | `Entitlement` with a required `Service` reference |
| Method labels | Canonical `Method` IDs |
| Capability labels | Canonical `Capability` IDs |
| Report types | Five canonical `DeliverableType` targets |
| Static Product configuration | Canonical `Product` and `Offer` records |
| Static Price configuration | Approved prices only; unapproved professional prices remain deferred |
| Knowledge configuration | PKR remains authority; PWS stores types and references only |

## Service migration

The 18 legacy service definitions are registered as definition-only canonical
`Service` objects. Every Service has an explicit Method mapping, derived
Capability requirements, a Deliverable Type and a boundary contract.

Migration does not activate a service, grant an entitlement, create a
Professional Assignment or create professional responsibility.

## Product and Price reconciliation

The canonical Product and Offer Registry now owns:

- Reality Journey Pass v1: `500` MYR minor units.
- Book I Chinese PDF: `8900` MYR minor units.

The Book Commerce module remains the operational fulfilment adapter and reads
the canonical Book I Product and Offer values. Static JSON remains a verified
compatibility record, not a write authority.

Professional pricing profiles do not contain approved amounts. They remain
deferred and cannot be converted into Offers until an authorised price is
provided.

## Knowledge boundary

`content/knowledge/registry` remains PKR-owned. Migration does not copy
Canonical Knowledge Nodes, Supporting Questions or Search Aliases into PWS.
PWS registers only `PublishedAssetType` and `DeliverableType`.

## Storage decision

No new D1 migration is added. Migration `0005_pws_universal_registry.sql`
already provides the required append-only Registry storage. W7 is an
idempotent data reconciliation and compatibility migration.

## Acceptance

```bash
npm run check:pws-i2-w7
```

The check executes the reconciliation twice, verifies zero duplicate writes,
checks all legacy mappings, confirms approved prices, preserves PKR data and
proves that the executable D1 migration count remains five.
