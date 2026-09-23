# Preview Auth0 reconciliation — 2026-09-23

Continuation from 30f60ae6. The owner supplied the public Preview provider, issuer, client ID and exact stable callback URL. These four values are now declared only in Wrangler env.preview.vars. AUTH_CLIENT_SECRET, AUTH_SESSION_SECRET and FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY remain external encrypted Secrets. No secret values are committed.

Production configuration, migrations and deployment are outside this change. Preview 0007/0008 remain applied; no new migration is introduced.

Deployment and real authentication evidence will be recorded after verification. Earlier providerConfigured:false evidence remains historical, not a claim about the new deployment.
