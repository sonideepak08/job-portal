import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// A fixed, local-only test database. Never use the application's DATABASE_URL.
const env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '3001',
  DB_HOST: '127.0.0.1',
  DB_PORT: '55432',
  DB_USER: 'job_portal_test',
  DB_PASSWORD: 'local_test_password',
  DB_NAME: 'job_portal_test',
  DATABASE_URL: 'postgresql://job_portal_test:local_test_password@127.0.0.1:55432/job_portal_test',
  JWT_SECRET: 'test-only-secret-not-for-production-123456',
  // Required by env.ts, but the auth-only test app never uses these services.
  REDIS_URL: 'redis://127.0.0.1:6379',
  AWS_REGION: 'ap-south-1',
  S3_RESUME_BUCKET: 'unused-test-bucket',
  SES_FROM_EMAIL: 'tests@example.com',
};
const cwd = fileURLToPath(new URL('../', import.meta.url));

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd, env, stdio: 'inherit', timeout: 120_000,
  });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}

// Use the locally installed Prisma version, without downloading a CLI via npx.
run(['node_modules/prisma/build/index.js', 'generate']);
run(['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
run(['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/auth.test.ts']);
