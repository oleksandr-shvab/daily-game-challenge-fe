// Dummy settings for the backend the e2e suite starts: a throwaway database and Redis db, no real
// keys. Process environment wins over any developer `.env`, so a local `.env` cannot change them.
// A local run on other ports sets E2E_DATABASE_URL and E2E_REDIS_URL (see CLAUDE.md, "End-to-end tests").
export const backendEnv: Record<string, string> = {
  ENVIRONMENT: 'local',
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ??
    'postgresql+asyncpg://postgres:postgres@localhost:5433/daily_game_challenge_e2e',
  REDIS_URL: process.env.E2E_REDIS_URL ?? 'redis://localhost:6379/2',
  SECRET_KEY: 'e2e-only-secret-key-not-used-anywhere-0000',
  FRONTEND_URL: 'http://localhost:5173',
  BACKEND_CORS_ORIGINS: '["http://localhost:5173"]',
  MEDIA_STORAGE: 'local',
  MEDIA_LOCAL_DIR: 'var/media',
  MEDIA_LOCAL_BASE_URL: 'http://localhost:5173/api',
}
