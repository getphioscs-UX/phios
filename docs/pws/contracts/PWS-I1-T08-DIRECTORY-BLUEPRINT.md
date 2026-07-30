# PWS-I1-T08 Canonical Directory Blueprint

Status: **Frozen v1**  
Schema version: `pws-v1`  
Baseline: `main@d2dcb2dc2a07428a10e3b1c0b0f8658dfebb1fdc`.

## Purpose

The blueprint freezes one logical ownership map for the PWS Runtime. It does
not move the existing frozen Core Runtime, create empty future modules, or
authorise work assigned to a later PWS phase.

`runtime/` is the logical architecture root. The current implementation roots
remain `functions/runtime/` and `functions/professional/` until an explicit,
accepted migration changes them.

## Canonical modules

```text
runtime/
  professional/
  capability/
  credential/
  method/
  service/
  product/
  commercial/
  entitlement/
  consent/
  journey/
  assignment/
  workspace/
  evidence/
  reading/
  navigation/
  deliverable/
  signature/
  knowledge/
  intelligence/
  operations/
  governance/
  security/
  integration/
```

Every module uses this closed internal directory vocabulary when its owning
phase implements it:

```text
schema/
registry/
operations/
permissions/
states/
events/
tests/
```

The vocabulary is a placement contract, not a requirement to create empty
directories. Files remain under their current owners until the responsible
phase performs a reviewed migration.

## Ownership boundaries

- Journey, Reading and Navigation remain owned by the frozen Core Runtime.
- Canonical Knowledge Nodes and Supporting Questions remain owned by PKR.
- Product, Offer, Price, Method and Service registration belongs to PWS-I2;
  commercial activation and Entitlement belong to PWS-I4.
- Professional Identity, Capability and Credential belong to PWS-I3.
- Assignment, Workspace, Professional Evidence projection and Deliverable
  production belong to PWS-I5.
- Operations, Governance, Privacy and Provider Intelligence remain separated
  across PWS-I6, PWS-I7, PWS-I8 and PWS-I9.
- Cross-system adapters belong to PWS-X1-PJA and cannot become another source
  of truth.

## Preserved boundaries

- No Runtime, API, Provider, Migration, D1 or page behaviour change.
- No bulk directory move, Legacy deletion or alias replacement.
- No empty scaffold that implies an unimplemented module is operational.
- Physical file location does not override the canonical object owner.
