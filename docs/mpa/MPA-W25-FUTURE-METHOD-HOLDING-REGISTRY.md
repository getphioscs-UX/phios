# MPA-W25｜Future Method Holding Registry

MPA-W25 creates a holding layer for future Methods without granting forward lifecycle authority.

The holding layer owns only two states:

- `DRAFT`
- `REGISTERED`

It does not own Validation, Activation, Production Eligibility, Production Execution, Professional Eligibility, or Public Release.

## Existing held Methods

`I_CHING`, `TAROT`, and `PSYCHOLOGY` are already registered in Method Registry v2. W25 does not rewrite that registry. It binds those identities into the Future Method Holding Registry as `REGISTERED`, while preserving their method-definition status as `DRAFT` and all Production/Professional flags as false.

## Other future Methods

A future Method may first enter the holding layer as `DRAFT` without silently entering Method Registry v2. Registration into the canonical Method Registry requires a separate versioned registry action. Forward movement beyond Holding requires independent Method activation evidence and a versioned successor path.

Holding never opens MPA-W26 or MPA-W27. Production cannot be inferred from registration, implementation, a checker pass, or a freeze.
