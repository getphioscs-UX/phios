# PWS-I1-T02 Canonical Identifiers

Status: **Frozen v1**  
Baseline: `getphioscs-UX/phios main@25e7e22c8a067e7835d84ab43ec027a5ffb12faf`

The machine-readable authority is
`docs/pws/contracts/pws-canonical-identifiers-v1.json`. T02 freezes naming,
format and compatibility rules; it does not implement an ID generator or
rewrite stored IDs.

## Canonical value format

New formal PWS identifiers use:

```text
<object-prefix>_<32 lowercase hexadecimal characters>
```

The random component represents 128 cryptographically secure random bits.
Identifiers contain no customer name, email, date of birth, organization name,
service meaning, status, date or sequential database number.

Formal PWS identifiers are issued by the future canonical write operation.
Browser code and AI Providers cannot issue them. Browser-only drafts use the
`draft` namespace and receive a new canonical ID only through an authorised
promotion operation.

## Field conventions

| Boundary | Convention | Example |
|---|---|---|
| Domain Contract, event, API payload and persistence | `snake_case` | `professional_id` |
| JavaScript read-only projection | `camelCase` adapter | `professionalId` |
| External system reference | `external_ids` container | Stripe or Provider reference |

The projection field is not a second identifier. It must carry the exact
canonical value and cannot become a write source.

## Existing implementation findings

The current repository contains date-plus-random browser identifiers,
Runtime/D1 snake-case keys, JavaScript camel-case projections, deterministic
fixture IDs and external gateway IDs. These remain valid within their existing
owners. T02 does not normalise them in place because doing so would break
lineage, persistence, frozen hashes and Legacy compatibility.

## Legacy boundaries

- Runtime IDs remain owned by Runtime.
- Book product, purchase, checkout, receipt and Entitlement IDs remain owned by
  Book Commerce.
- Financial infrastructure IDs remain owned by its immutable Migration.
- Stripe and Provider IDs are external references, never PHI OS primary keys.
- W1 Professional access accepts existing ID values but cannot reissue them.
- `case_id`, `task_id`, `job_id` and `ticket_id` require domain context and
  cannot be converted by string replacement or AI inference.
- `reality_demo_id` has no formal-object mapping.

## Non-actions

T02 adds no Registry entry, Runtime Contract entry, Migration, database column,
API route, generator, page code or production behaviour.
