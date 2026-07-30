# PJA Source Governance Policy

## Source authority

A Source record identifies and assesses material that may inform Claims. It
does not prove a Claim merely by existing. It cannot approve an Article,
determine Canonical meaning or provide public Article body content.

Source Codes use `SRC-<DOMAIN>-<NNN>`-style stable identities. A URL is a
locator, never the Source identity. The same work is not registered under
multiple Codes; superseded Codes are retained and never reused.

## Types and quality

The Schema allowlists official, academic, professional, standards,
government, institutional, historical, reputable journalism, verified data and
PHI OS controlled source types. Professional blogs, talks, interviews and
secondary summaries require caution.

Authority is:

```text
primary
authoritative_secondary
reputable_secondary
contextual
reference_only
```

Reliability is `high`, `medium`, `low` or `not_assessed`. Currency is
`current`, `historical`, `potentially_outdated`, `superseded`,
`not_applicable` or `not_assessed`. A famous website is not automatically
suitable for every Claim.

## Support mapping

Each Claim mapping records `direct`, `partial`, `contextual`, `contradictory`
or `not_supportive` support and a `strong`, `moderate`, `weak`, `none` or
`not_assessed` level. The mapping describes exactly what the source supports
and includes a locator.

Contradictory and non-supportive mappings do not count toward minimum support.
Reference-only sources cannot support high or critical Claims. Deprecated
sources cannot support new Claims. Source quantity never replaces quality or
scope assessment.

## Contrary evidence

Material contrary evidence is retained. Conflicts are classified by method,
scope, definition, date, interpretation or direct contradiction. Open academic
disputes are returned to human review; AI does not decide them.

## Internal PHI OS sources

Canonical, book and internal-research sources may support PHI OS
Interpretations. They do not prove external historical or technical facts.
Paid manuscripts remain controlled: only necessary metadata and scope may be
recorded, never a complete paid chapter.

## Review and public metadata

Source review and Source publication status are separate. Public status is:

```text
internal_only
public_citation_allowed
public_metadata_only
restricted
deprecated
```

Only the two public statuses may enter a public bibliography. Internal paths,
private links, paid locations and reviewer notes never project.

## Acquisition, copyright, privacy and security

Human upload, human registration, controlled public-source reading and future
controlled import are allowed. Search results, unknown crawls and AI summaries
cannot auto-register or auto-approve sources.

Store metadata, paraphrased support summaries and locators, not mirrored
articles or long copyrighted passages. Do not store credentials, private
contact information, private Drive links, customer data, Reality Journey data
or Professional Notes.
