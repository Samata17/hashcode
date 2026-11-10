// Browser test: clicks through DevBlog like a real user, in Microsoft Edge or Google Chrome.
//
// It needs the app running WITH SAMPLE DATA, so start (in two terminals):
//   cd backend  && npm run dev:memory
//   cd frontend && npm run dev
// Then from the project root:  npm run test:e2e
// Screenshots are saved to e2e/screenshots/ (failures are named fail-<step>.png).
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.E2E_URL || 'http://localhost:5173';
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

// Use a browser that is already installed (no big download needed).
async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // not installed - try the next one
    }
  }
  console.error('Could not find Microsoft Edge or Google Chrome. Please install one of them.');
  process.exit(1);
}

try {
  await fetch(`${BASE}/api/health`);
} catch {
  console.error(`DevBlog is not running at ${BASE}. Start the backend and frontend first (see the top of this file).`);
  process.exit(1);
}

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && problems.push(`console: ${m.text()}`));

let n = 0;
async function step(name, fn) {
  n++;
  try {
    await fn();
    console.log(`✔ ${n}. ${name}`);
  } catch (e) {
    console.log(`✖ ${n}. ${name}\n    ${e.message.split('\n')[0]}`);
    await page.screenshot({ path: `${SHOTS}/fail-${n}.png`, fullPage: true });
    process.exitCode = 1;
  }
}
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const toast = (text) => page.locator('.toast', { hasText: text }).first().waitFor({ timeout: 5000 });
const stamp = Date.now();
const email = `tester${stamp}@example.com`;
const title = `My E2E Test Article ${stamp}`;

await step('home shows featured + latest posts, no drafts', async () => {
  await page.goto(BASE);
  await page.locator('.post-card-featured').waitFor();
  const count = await page.locator('.post-card').count();
  assert.ok(count >= 6, `cards=${count}`);
  assert.equal(await page.getByText('TypeScript Generics').count(), 0);
  await shot('01-home');
});

await step('navbar search filters by title', async () => {
  await page.fill('.search input', 'git');
  await page.press('.search input', 'Enter');
  await page.waitForURL(/search=git/);
  await page.getByText('Results for').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.post-card').length === 1 && !document.querySelector('.skeleton'));
  assert.match(await page.locator('.post-card-title').first().innerText(), /Git Commands/);
});

await step('tag filter chip on homepage', async () => {
  await page.goto(BASE);
  await page.locator('.filter-chip', { hasText: '#css' }).click();
  await page.waitForURL(/tag=css/);
  await page.waitForFunction(() => document.querySelectorAll('.post-card').length === 1 && !document.querySelector('.skeleton'));
});

await step('tags page lists tags with counts and opens a tag', async () => {
  await page.goto(`${BASE}/tags`);
  await page.locator('.tag-card').first().waitFor();
  assert.ok((await page.locator('.tag-card').count()) >= 8);
  await page.locator('.tag-card', { hasText: '#react' }).click();
  await page.waitForURL(/\/tags\/react/);
  await page.waitForFunction(() => document.querySelector('.post-card') && !document.querySelector('.skeleton'));
  assert.equal(await page.locator('.post-card').count(), 2);
});

await step('article page renders markdown + highlighted code, no edit button for guests', async () => {
  await page.goto(`${BASE}/post/building-a-rest-api-with-express-and-mongodb`);
  await page.locator('.article-header h1').waitFor();
  assert.ok((await page.locator('.code-block').count()) >= 3);
  assert.ok((await page.locator('.code-block span.token').count()) > 5, 'syntax tokens');
  assert.equal(await page.locator('.markdown table').count(), 1);
  assert.equal(await page.getByText('Edit post').count(), 0);
  await page.locator('.code-block').first().scrollIntoViewIfNeeded();
  await shot('02-article');
});

await step('profile page shows author and posts', async () => {
  await page.goto(`${BASE}/u/marcus-lee`);
  await page.locator('.profile-info h1', { hasText: 'Marcus Lee' }).waitFor();
  assert.equal(await page.locator('.post-card').count(), 2);
});

await step('unknown article shows not-found state', async () => {
  await page.goto(`${BASE}/post/does-not-exist`);
  await page.getByText('Article not found').waitFor();
});

await step('private page redirects guests to login', async () => {
  await page.goto(`${BASE}/dashboard`);
  await page.waitForURL(/\/login/);
});

await step('register shows validation errors', async () => {
  await page.goto(`${BASE}/register`);
  await page.click('button[type=submit]');
  assert.equal(await page.locator('.field-error').count(), 3);
  await page.fill('#name', 'Test User');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.fill('#confirm', 'different');
  await page.click('button[type=submit]');
  await page.getByText('Passwords do not match.').waitFor();
  await shot('03-register');
});

await step('register with duplicate email shows server error', async () => {
  await page.fill('#email', 'priya@devblog.sample');
  await page.fill('#confirm', 'secret123');
  await page.click('button[type=submit]');
  await page.getByText('An account with this email already exists.').waitFor();
});

await step('register succeeds -> dashboard with empty state', async () => {
  await page.fill('#email', email);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard/);
  await toast('Account created');
  await page.getByText("You haven't written anything yet").waitFor();
});

await step('stays logged in after refresh', async () => {
  await page.reload();
  await page.locator('.user-menu-button').waitFor();
  assert.equal(await page.getByRole('link', { name: 'Log in' }).count(), 0);
});

await step('editor: validation on empty publish', async () => {
  await page.click('text=✎ Write');
  await page.waitForURL(/\/write/);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByText('Title must be 3 to 150 characters.').waitFor();
  await page.getByText('Content cannot be empty.').waitFor();
});

await step('editor: fill form, tags, toolbar, preview', async () => {
  await page.fill('#title', title);
  await page.fill('#tags', 'Testing');
  await page.press('#tags', 'Enter');
  await page.fill('#tags', 'JavaScript');
  await page.press('#tags', 'Enter');
  assert.equal(await page.locator('.tag-pill').count(), 2);
  await page.fill('#content', '## Hello heading\n\nSome text.\n\n```js\nconst x = 1;\n```\n');
  await page.click('button[aria-label=Bold]');
  assert.match(await page.inputValue('#content'), /\*\*bold text\*\*/);
  await page.getByRole('tab', { name: 'Side by side' }).click();
  await page.locator('.preview-pane h2', { hasText: 'Hello heading' }).waitFor();
  await page.locator('.preview-pane .code-block').waitFor();
  await shot('04-editor');
  await page.getByRole('tab', { name: 'Preview' }).click();
  assert.equal(await page.locator('#content').count(), 0);
  await page.getByRole('tab', { name: 'Write' }).click();
});

await step('save draft -> URL becomes /edit/:id; draft not in public feed', async () => {
  await page.getByRole('button', { name: 'Save draft' }).click();
  await toast('Draft saved');
  await page.waitForURL(/\/edit\/[a-f0-9]{24}/);
  assert.equal(await page.inputValue('#title'), title); // form kept
  await page.goto(`${BASE}/?search=${encodeURIComponent('E2E Test')}`);
  await page.getByText('No articles found').waitFor();
});

await step('dashboard shows the draft; publish it from dashboard', async () => {
  await page.goto(`${BASE}/dashboard`);
  const row = page.locator('.dash-item', { hasText: title });
  await row.waitFor();
  assert.match(await row.locator('.badge').innerText(), /Draft/);
  await shot('05-dashboard');
  await row.getByRole('button', { name: 'Publish' }).click();
  await toast('Post published');
  assert.match(await row.locator('.badge').innerText(), /Published/);
  await page.goto(`${BASE}/?search=${encodeURIComponent('E2E Test')}`);
  await page.locator('.post-card-title', { hasText: title }).waitFor();
});

await step('edit published post -> article shows new title', async () => {
  await page.locator('.post-card-title a', { hasText: title }).click();
  await page.getByRole('link', { name: '✎ Edit post' }).click();
  await page.waitForURL(/\/edit\//);
  await page.locator('#title').waitFor();
  await page.fill('#title', `${title} (edited)`);
  await page.getByRole('button', { name: 'Update article' }).click();
  await toast('Article updated');
  await page.waitForURL(/\/post\//);
  await page.locator('.article-header h1', { hasText: '(edited)' }).waitFor();
});

await step('edit profile updates navbar + public profile', async () => {
  await page.goto(`${BASE}/settings`);
  await page.fill('#bio', 'I test things automatically.');
  await page.fill('#avatar', 'not a url');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Avatar must be a full URL').waitFor();
  await page.fill('#avatar', '');
  await page.fill('#name', 'Tess Tester');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast('Profile updated');
  await page.click('.user-menu-button');
  await page.locator('.dropdown-header strong', { hasText: 'Tess Tester' }).waitFor();
  await page.click('.dropdown >> text=My profile');
  await page.getByText('I test things automatically.').waitFor();
});

await step('delete: cancel keeps post, confirm removes it', async () => {
  await page.goto(`${BASE}/dashboard`);
  const row = page.locator('.dash-item', { hasText: title });
  await row.getByRole('button', { name: 'Delete' }).click();
  await page.locator('.modal').waitFor();
  await shot('06-delete-dialog');
  await page.getByRole('button', { name: 'Cancel' }).click();
  assert.equal(await page.locator('.modal').count(), 0);
  assert.equal(await row.count(), 1);
  await row.getByRole('button', { name: 'Delete' }).click();
  await page.locator('.modal').getByRole('button', { name: 'Delete' }).click();
  await toast('Post deleted');
  await page.getByText("You haven't written anything yet").waitFor();
});

await step('logout, then login with wrong + right password', async () => {
  await page.click('.user-menu-button');
  await page.click('.dropdown >> text=Log out');
  await page.getByRole('link', { name: 'Log in' }).waitFor();
  await page.goto(`${BASE}/login`);
  await page.fill('#email', 'priya@devblog.sample');
  await page.fill('#password', 'wrongpass');
  await page.click('button[type=submit]');
  await page.getByText('Incorrect email or password.').waitFor();
  await shot('07-login-error');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard/);
  await page.locator('.dash-item').first().waitFor();
  assert.equal(await page.locator('.dash-item').count(), 2);
});

await step("logged-in user sees no Edit button on someone else's post; edit URL blocked", async () => {
  await page.goto(`${BASE}/post/git-commands-every-developer-should-know`);
  await page.locator('.article-header h1').waitFor();
  assert.equal(await page.getByText('Edit post').count(), 0);
  const id = await page.evaluate(async () => {
    const r = await fetch('/api/posts/git-commands-every-developer-should-know');
    return (await r.json()).post._id;
  });
  await page.goto(`${BASE}/edit/${id}`);
  await page.getByText("Can't open this article").waitFor();
  await page.getByText('You can only change your own posts.').waitFor();
});

await step('mobile: menu toggle works and page has no sideways scroll', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE);
  await page.locator('.post-card').first().waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `overflow ${overflow}px`);
  await shot('08-mobile-home');
  await page.click('.menu-toggle');
  await page.locator('.nav-menu.open').waitFor();
  await page.locator('.nav-menu >> text=Log out').waitFor();
  await shot('09-mobile-menu');
  await page.goto(`${BASE}/post/building-a-rest-api-with-express-and-mongodb`);
  await page.locator('.code-block').first().waitFor();
  const o2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(o2 <= 0, `article overflow ${o2}px`);
});

await step('no JavaScript errors in the browser console', async () => {
  assert.deepEqual(problems, []);
});

await browser.close();
