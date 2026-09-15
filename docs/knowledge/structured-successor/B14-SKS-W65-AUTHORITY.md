# W65 authority checker on 403b681

The checker validates the existing structured authority contract, discovery and backlink roles, four book registries and all 71 extraction candidates. W64 structural checks and digest-bound candidate reconstruction run first. Each object must retain a canonical node in its registered book authority and manuscript references; another node registry cannot substitute for that path.

Discovery/backlinks remain DISCOVERY_ONLY with canonicalAuthority false. Structured objects remain IN_REVIEW. Candidates remain pending human review, without canonical authority or automatic writeback. The current deterministic extraction has no AI invocation; a future provider-assisted extraction needs an explicit successor rather than silently changing this baseline. This does not equate all AI assistance with authority.

Twenty article-summary candidates must retain article summary provenance and cannot become canonical definitions. Eleven source-definition candidates remain tied to existing canonicalMeaning fields. Forty unresolved candidates must keep null meaning. The checker does not resolve any of these human/extraction gaps.

Twelve mutation tests reject master/projection promotion, unregistered node paths, missing canonical sources, article-only sourcing, LLM candidate authority, automatic writeback, article summary relabelling and invented unresolved meanings. Tests clone inputs and do not write decisions. This gate covers the registered structured corpus and authority pointers; it is not a repository-wide proof that arbitrary unrelated code cannot create a new runtime.

Run npm run check:b14-sks-authority. W66 relationship checks are next. Human review and production acceptance remain separate and pending.
