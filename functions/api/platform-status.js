export async function onRequestGet({ env = {} }) {
  return Response.json({
    success: true,
    platform: 'PHI OS',
    architectureTarget: 'v3.0',
    currentImplementation: 'foundation-and-landing',
    services: {
      openaiConfigured: Boolean(env.OPENAI_API_KEY),
      databaseBound: Boolean(env.RUNTIME_DB || env.DB),
      runtimeDatabaseBound: Boolean(env.RUNTIME_DB),
      objectStorageBound: Boolean(env.REPORTS),
      sessionCacheBound: Boolean(env.SESSIONS)
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
