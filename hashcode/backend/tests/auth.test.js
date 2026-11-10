// Automated tests for the auth API.
// They use a temporary in-memory MongoDB, so your real database is never touched.
// Run with: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

let mongo;
let server;
let base;

before(async () => {
  process.env.JWT_SECRET = 'test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init(); // make sure unique indexes exist
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const jane = { name: 'Jane Doe', email: 'Jane@Example.com', password: 'secret123' };
let token;

test('register creates a user and returns a token (no password)', async () => {
  const r = await call('POST', '/auth/register', jane);
  assert.equal(r.status, 201);
  assert.ok(r.body.token);
  assert.equal(r.body.user.email, 'jane@example.com');
  assert.equal(r.body.user.username, 'jane-doe');
  assert.equal(r.body.user.password, undefined);
  token = r.body.token;
});

test('password is stored as a bcrypt hash, not plain text', async () => {
  const u = await User.findOne({ email: 'jane@example.com' }).select('+password');
  assert.notEqual(u.password, jane.password);
  assert.match(u.password, /^\$2[aby]\$/);
});

test('register rejects a duplicate email', async () => {
  const r = await call('POST', '/auth/register', jane);
  assert.equal(r.status, 409);
});

test('register validates input', async () => {
  const r = await call('POST', '/auth/register', { name: 'J', email: 'bad', password: '1' });
  assert.equal(r.status, 400);
  assert.equal(r.body.errors.length, 3);
});

test('second user with same name gets a unique username', async () => {
  const r = await call('POST', '/auth/register', { ...jane, email: 'other@example.com' });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.username, 'jane-doe-2');
});

test('login works with correct password, fails with wrong one', async () => {
  const ok = await call('POST', '/auth/login', { email: 'JANE@example.com', password: 'secret123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const bad = await call('POST', '/auth/login', { email: jane.email, password: 'wrong' });
  assert.equal(bad.status, 401);
});

test('/auth/me requires a valid token', async () => {
  assert.equal((await call('GET', '/auth/me')).status, 401);
  assert.equal((await call('GET', '/auth/me', null, 'garbage')).status, 401);

  const me = await call('GET', '/auth/me', null, token);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.name, 'Jane Doe');
});

test('too many login attempts are blocked (rate limit)', async () => {
  let last;
  for (let i = 0; i < 31; i++) {
    // eslint-disable-next-line no-await-in-loop
    last = await call('POST', '/auth/login', { email: jane.email, password: 'wrong' });
    if (last.status === 429) break;
  }
  assert.equal(last.status, 429);
  assert.match(last.body.message, /Too many attempts/);
});

test('unknown routes return 404 JSON', async () => {
  const r = await call('GET', '/nope');
  assert.equal(r.status, 404);
});
