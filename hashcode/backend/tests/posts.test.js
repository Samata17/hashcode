// Tests for posts, tags, search, and profiles - using a temporary in-memory MongoDB.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';

let mongo;
let server;
let base;

before(async () => {
  process.env.JWT_SECRET = 'test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await mongoose.syncIndexes();
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

let alice; // token
let bob; // token
let published; // post
let draft; // post

test('setup: register two users', async () => {
  alice = (await call('POST', '/auth/register', { name: 'Alice Dev', email: 'alice@x.com', password: 'secret123' })).body.token;
  bob = (await call('POST', '/auth/register', { name: 'Bob Coder', email: 'bob@x.com', password: 'secret123' })).body.token;
  assert.ok(alice && bob);
});

test('creating a post requires login', async () => {
  const r = await call('POST', '/posts', { title: 'Hello', content: 'x' });
  assert.equal(r.status, 401);
});

test('create post validates input', async () => {
  const r = await call('POST', '/posts', { title: 'Hi', content: '', coverImage: 'not-a-url', tags: [1, 2, 3, 4, 5, 6] }, alice);
  assert.equal(r.status, 400);
  const fields = r.body.errors.map((e) => e.field);
  assert.ok(fields.includes('title'));
  assert.ok(fields.includes('content'));
  assert.ok(fields.includes('coverImage'));
  assert.ok(fields.includes('tags'));
});

test('create a published post: slug, excerpt, tags, author', async () => {
  const r = await call(
    'POST',
    '/posts',
    {
      title: 'Getting Started with React!',
      content: '# Intro\n\nReact is a **library** for UIs.\n\n```js\nconsole.log(1)\n```',
      tags: ['React', 'JavaScript', 'react'],
      status: 'published',
      author: 'someone-else-id', // should be ignored
    },
    alice
  );
  assert.equal(r.status, 201);
  published = r.body.post;
  assert.equal(published.slug, 'getting-started-with-react');
  assert.deepEqual(published.tags, ['react', 'javascript']);
  assert.ok(published.publishedAt);
  assert.match(published.excerpt, /React is a library for UIs/);
  assert.doesNotMatch(published.excerpt, /console/);
  assert.equal(published.readingTime, 1);
});

test('same title gets a unique slug', async () => {
  const r = await call('POST', '/posts', { title: 'Getting Started with React!', content: 'Other', status: 'published', tags: ['Node.js'] }, bob);
  assert.equal(r.body.post.slug, 'getting-started-with-react-2');
});

test('create a draft (default status)', async () => {
  const r = await call('POST', '/posts', { title: 'Secret Draft', content: 'Not ready', tags: ['secret-tag'] }, alice);
  assert.equal(r.status, 201);
  draft = r.body.post;
  assert.equal(draft.status, 'draft');
});

test('public feed shows only published posts, with author info but no email', async () => {
  const r = await call('GET', '/posts');
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 2);
  assert.ok(r.body.posts.every((p) => p.status === 'published'));
  assert.ok(!r.body.posts.some((p) => p.title === 'Secret Draft'));
  assert.equal(r.body.posts[0].author.email, undefined);
  assert.ok(r.body.posts[0].author.username);
});

test('feed search by title (case-insensitive, special chars safe)', async () => {
  assert.equal((await call('GET', '/posts?search=react')).body.total, 2);
  assert.equal((await call('GET', '/posts?search=secret')).body.total, 0); // draft hidden
  assert.equal((await call('GET', '/posts?search=c%2B%2B(')).status, 200); // "c++(" doesn't crash
});

test('feed filter by tag and author', async () => {
  assert.equal((await call('GET', '/posts?tag=javascript')).body.total, 1);
  assert.equal((await call('GET', '/posts?tag=nodejs')).body.total, 1);
  assert.equal((await call('GET', '/posts?author=bob-coder')).body.total, 1);
  assert.equal((await call('GET', '/posts?author=nobody')).body.total, 0);
});

test('feed pagination', async () => {
  const r = await call('GET', '/posts?limit=1&page=2');
  assert.equal(r.body.posts.length, 1);
  assert.equal(r.body.totalPages, 2);
});

test('article by slug; draft visible only to its author', async () => {
  const pub = await call('GET', `/posts/${published.slug}`);
  assert.equal(pub.status, 200);
  assert.ok(pub.body.post.content.includes('React'));

  assert.equal((await call('GET', `/posts/${draft.slug}`)).status, 404); // guest
  assert.equal((await call('GET', `/posts/${draft.slug}`, null, bob)).status, 404); // other user
  assert.equal((await call('GET', `/posts/${draft.slug}`, null, alice)).status, 200); // author
});

test('dashboard (/posts/mine) shows my drafts and published posts only', async () => {
  const r = await call('GET', '/posts/mine', null, alice);
  assert.equal(r.status, 200);
  assert.equal(r.body.posts.length, 2);
  assert.equal((await call('GET', '/posts/mine')).status, 401);
});

test('another user cannot edit, delete, or load the edit form of my post', async () => {
  assert.equal((await call('PUT', `/posts/${published._id}`, { title: 'Hacked title' }, bob)).status, 403);
  assert.equal((await call('DELETE', `/posts/${published._id}`, null, bob)).status, 403);
  assert.equal((await call('GET', `/posts/edit/${draft._id}`, null, bob)).status, 403);
  // and the post is unchanged
  assert.equal((await call('GET', `/posts/${published.slug}`)).body.post.title, 'Getting Started with React!');
});

test('invalid or unknown ids give clear errors', async () => {
  assert.equal((await call('PUT', '/posts/not-an-id', { title: 'x x x' }, alice)).status, 400);
  assert.equal((await call('DELETE', '/posts/507f1f77bcf86cd799439011', null, alice)).status, 404);
});

test('author can edit a draft (slug follows title) and then publish it', async () => {
  const edited = await call('PUT', `/posts/${draft._id}`, { title: 'My Ready Post', content: 'Now ready!' }, alice);
  assert.equal(edited.status, 200);
  assert.equal(edited.body.post.slug, 'my-ready-post');
  assert.equal(edited.body.post.excerpt, 'Now ready!');

  const pub = await call('PUT', `/posts/${draft._id}`, { status: 'published' }, alice);
  assert.equal(pub.body.post.status, 'published');
  assert.ok(pub.body.post.publishedAt);
  assert.equal((await call('GET', '/posts')).body.total, 3);
});

test('published post keeps its slug when the title changes', async () => {
  const r = await call('PUT', `/posts/${published._id}`, { title: 'React Basics' }, alice);
  assert.equal(r.body.post.slug, 'getting-started-with-react');
  assert.equal(r.body.post.title, 'React Basics');
});

test('tags list counts only published posts', async () => {
  // put the post back into draft: its tag should disappear from the public list
  await call('PUT', `/posts/${draft._id}`, { status: 'draft' }, alice);
  const r = await call('GET', '/tags');
  assert.equal(r.status, 200);
  const bySlug = Object.fromEntries(r.body.tags.map((t) => [t.slug, t]));
  assert.equal(bySlug.react.count, 1);
  assert.equal(bySlug.react.name, 'React');
  assert.equal(bySlug.nodejs.name, 'Node.js');
  assert.equal(bySlug['secret-tag'], undefined);

  const one = await call('GET', '/tags/javascript');
  assert.equal(one.body.tag.count, 1);
  assert.equal((await call('GET', '/tags/does-not-exist')).status, 404);
});

test('public profile shows published posts only and no email', async () => {
  const r = await call('GET', '/users/alice-dev');
  assert.equal(r.status, 200);
  assert.equal(r.body.user.name, 'Alice Dev');
  assert.equal(r.body.user.email, undefined);
  assert.equal(r.body.posts.length, 1); // the other one is a draft again
  assert.equal((await call('GET', '/users/ghost')).status, 404);
});

test('update my profile; protected fields are ignored', async () => {
  const r = await call(
    'PUT',
    '/users/me',
    { name: 'Alice Smith', bio: 'I write about React.', avatar: 'https://example.com/a.png', email: 'evil@x.com', username: 'admin' },
    alice
  );
  assert.equal(r.status, 200);
  assert.equal(r.body.user.name, 'Alice Smith');
  assert.equal(r.body.user.bio, 'I write about React.');
  assert.equal(r.body.user.email, 'alice@x.com');
  assert.equal(r.body.user.username, 'alice-dev');

  assert.equal((await call('PUT', '/users/me', { avatar: 'javascript:alert(1)' }, alice)).status, 400);
  assert.equal((await call('PUT', '/users/me', { name: 'X' })).status, 401);
});

test('author can delete their own post', async () => {
  const r = await call('DELETE', `/posts/${draft._id}`, null, alice);
  assert.equal(r.status, 200);
  assert.equal((await call('GET', `/posts/edit/${draft._id}`, null, alice)).status, 404);
});
