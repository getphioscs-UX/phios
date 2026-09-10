# PVP-R1-VIS-W15 — ECR Topic Lens

Baseline: `ffc05bc07345011bc24e68884cc1d569c8d96418`.

W15 reuses production-admitted `ECR_TOPIC_R1`; PVP does not invent topic-to-node mapping. Six governed topic lenses are consumed from the existing topic projection. Production defaults to `FREE_PREVIEW`, with no more than four selected-owner node IDs exposed per topic in the free state.

The ECR product adapter now preserves the governed topic projection `accessState` so the customer projection can disclose provenance accurately. This does not grant paid access and does not make the renderer an entitlement authority.

Status: `MACHINE_ACCEPTED_GOVERNED_TOPIC_LENS`.
