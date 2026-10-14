import assert from 'node:assert/strict';
import { before, after, describe, it } from 'node:test';
import { randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';

// Check BEFORE importing modules that create the database client.
assert.equal(process.env.NODE_ENV, 'test', 'Run this suite with npm test');
assert.equal(
  process.env.DATABASE_URL,
  'postgresql://job_portal_test:local_test_password@127.0.0.1:55432/job_portal_test',
  'Refusing to run against any other database',
);

const { default: express } = await import('express');
const { default: bcrypt } = await import('bcrypt');
const { default: jwt } = await import('jsonwebtoken');
const { default: authRouter } = await import('../src/routes/auth.routes.ts');
const { globalErrorHandler } = await import('../src/middleware/errorHandler.ts');
const { prisma } = await import('../src/config/prisma.ts');

// Mount the real router and error handler. Other routers eagerly create queue
// connections, so this focused auth integration suite does not import app.ts.
const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use(globalErrorHandler);

let server: Server;
let baseUrl: string;
const emails: string[] = [];
const password = 'TestPassword123!';

async function post(path: string, body: object) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return { status: response.status, body: await response.json() };
}

async function registerCandidate() {
  const email = `auth-${randomUUID()}@example.com`;
  emails.push(email); // Record before the request so cleanup also handles failures.
  const response = await post('/auth/register', {
    name: 'Test Candidate', email, password, role: 'CANDIDATE',
  });
  assert.equal(response.status, 201);
  return { email, response };
}

before(async () => {
  await prisma.$connect();
  server = app.listen(0, '127.0.0.1'); // Let the OS choose a free HTTP port.
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  try {
    // Delete only records created by this run, respecting foreign keys.
    await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { email: { in: emails } }, select: { id: true },
      });
      const ids = users.map((user) => user.id);
      await tx.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    });
  } finally {
    try {
      if (server?.listening) {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
          server.closeAllConnections();
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  }
});

describe('Authentication API — registration and login', { concurrency: false }, () => {
  it('registers a candidate, hashes the password, and does not expose it', async () => {
    const { email, response } = await registerCandidate();
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.email, email);
    assert.equal(response.body.data.role, 'CANDIDATE');
    assert.equal(Object.hasOwn(response.body.data, 'password'), false);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.equal(response.body.data.id, user.id);
    assert.notEqual(user.password, password);
    assert.equal(await bcrypt.compare(password, user.password), true);
  });

  it('logs in with correct credentials and stores only the refresh-token hash', async () => {
    const { email } = await registerCandidate();
    const response = await post('/auth/login', { email, password });
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    const { accessToken, refreshToken } = response.body.data;
    assert.equal(typeof accessToken, 'string');
    assert.equal(typeof refreshToken, 'string');
    assert.ok(refreshToken.length > 0);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET!);
    assert.ok(typeof payload !== 'string');
    assert.equal(payload.userId, user.id);
    assert.equal(payload.role, 'CANDIDATE');
    assert.ok(payload.exp! > Math.floor(Date.now() / 1000));

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const stored = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash } });
    assert.equal(stored.userId, user.id);
    assert.notEqual(stored.tokenHash, refreshToken);
    assert.equal(stored.revokedAt, null);
    assert.ok(stored.expiresAt.getTime() > Date.now());
  });

  it('rejects a wrong password without issuing tokens', async () => {
    const { email } = await registerCandidate();
    const response = await post('/auth/login', { email, password: 'WrongPassword123!' });
    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Invalid email or password');
    assert.equal(response.body.data, undefined);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.equal(await prisma.refreshToken.count({ where: { userId: user.id } }), 0);
  });

  it('rejects an unknown email with the same generic error', async () => {
    const response = await post('/auth/login', {
      email: `unknown-${randomUUID()}@example.com`, password,
    });
    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'Invalid email or password');
    assert.equal(response.body.data, undefined);
  });
});
