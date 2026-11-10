// ============================================================
//  SAMPLE DATA - for local development and demos only.
//  Every sample account uses an email ending in "@devblog.sample"
//  and the password "password123".
// ============================================================
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Tag } from '../models/Tag.js';
import { uniqueSlug } from '../utils/slugify.js';
import { syncTags } from '../utils/tags.js';
import { makeExcerpt } from '../utils/text.js';

export const SAMPLE_EMAIL_DOMAIN = '@devblog.sample';
export const SAMPLE_PASSWORD = 'password123';

const users = [
  {
    key: 'priya',
    name: 'Priya Sharma',
    bio: 'Sample account. Frontend engineer who loves React, accessibility, and clean CSS.',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    key: 'marcus',
    name: 'Marcus Lee',
    bio: 'Sample account. Backend developer. Node.js, databases, and APIs that do not break.',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    key: 'sofia',
    name: 'Sofia Martins',
    bio: 'Sample account. Full-stack dev and part-time teacher. Writing the guides I wish I had.',
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
];

const tagDescriptions = {
  react: 'A JavaScript library for building user interfaces.',
  javascript: 'The language of the web.',
  nodejs: 'JavaScript on the server.',
  mongodb: 'A document database for modern apps.',
  css: 'Styling the web, one rule at a time.',
  webdev: 'Everything about building for the web.',
  beginners: 'Friendly guides for people just starting out.',
  git: 'Version control for every project.',
};

const posts = [
  {
    author: 'priya',
    title: 'React Hooks Explained: useState and useEffect for Beginners',
    tags: ['React', 'JavaScript', 'Beginners'],
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80',
    daysAgo: 1,
    content: `Hooks let you use state and other React features in function components. In this guide we'll cover the two you'll use every day.

## useState: remembering values

\`useState\` gives a component its own memory. It returns the current value and a function to update it.

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

Every time you call \`setCount\`, React re-renders the component with the new value.

## useEffect: doing things after render

Use \`useEffect\` for side effects such as fetching data, timers, or subscriptions.

\`\`\`jsx
import { useEffect, useState } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then(setUsers);
  }, []); // [] = run once, after the first render

  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
\`\`\`

## Rules of hooks

1. Only call hooks at the **top level** of your component.
2. Only call hooks from **React functions**.

> Tip: install the \`eslint-plugin-react-hooks\` package and it will warn you when you break these rules.

That's it! With these two hooks you can build most components you'll ever need.`,
  },
  {
    author: 'marcus',
    title: 'Building a REST API with Express and MongoDB',
    tags: ['Node.js', 'MongoDB', 'JavaScript'],
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
    daysAgo: 2,
    content: `A REST API lets your frontend talk to your database. Let's build a tiny one with **Express** and **Mongoose**.

## 1. Install the packages

\`\`\`bash
npm init -y
npm install express mongoose dotenv
\`\`\`

## 2. Create a model

\`\`\`js
import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
}, { timestamps: true });

export const Note = mongoose.model('Note', noteSchema);
\`\`\`

## 3. Add routes

\`\`\`js
import express from 'express';
import { Note } from './Note.js';

const app = express();
app.use(express.json());

app.get('/api/notes', async (req, res) => {
  res.json(await Note.find().sort({ createdAt: -1 }));
});

app.post('/api/notes', async (req, res) => {
  const note = await Note.create({ text: req.body.text });
  res.status(201).json(note);
});
\`\`\`

## Status codes worth knowing

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad request (invalid input) |
| 401  | Not logged in |
| 403  | Logged in, but not allowed |
| 404  | Not found |

Always **validate input** and **check permissions on the server**. The frontend can be bypassed; the backend can't.`,
  },
  {
    author: 'sofia',
    title: 'Modern CSS Layouts: Flexbox vs Grid',
    tags: ['CSS', 'WebDev', 'Beginners'],
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1200&q=80',
    daysAgo: 4,
    content: `Flexbox and Grid are both layout tools, but they solve different problems.

## Flexbox: one direction

Use Flexbox when items flow in a **row or a column**, like a navbar.

\`\`\`css
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
\`\`\`

## Grid: two directions

Use Grid when you need **rows and columns** at the same time, like a card gallery.

\`\`\`css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
\`\`\`

That single \`grid-template-columns\` line makes a responsive layout with **no media queries**.

## Quick rule

- Content decides the layout → **Flexbox**
- Layout decides where content goes → **Grid**`,
  },
  {
    author: 'marcus',
    title: 'JWT Authentication in Node.js, Step by Step',
    tags: ['Node.js', 'JavaScript', 'WebDev'],
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80',
    daysAgo: 6,
    content: `JSON Web Tokens (JWTs) are a popular way to keep users logged in to an API.

## How it works

1. The user logs in with email and password.
2. The server checks the password with **bcrypt** and signs a token.
3. The browser sends the token in the \`Authorization\` header on every request.
4. The server verifies the token before doing anything private.

## Signing a token

\`\`\`js
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  expiresIn: '7d',
});
\`\`\`

## Protecting a route

\`\`\`js
export function protect(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Please log in' });

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
\`\`\`

> Never put your \`JWT_SECRET\` in frontend code. Keep it in a \`.env\` file on the server.`,
  },
  {
    author: 'sofia',
    title: 'Git Commands Every Developer Should Know',
    tags: ['Git', 'Beginners'],
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200&q=80',
    daysAgo: 9,
    content: `Git can feel scary, but you only need a handful of commands day to day.

## Starting out

\`\`\`bash
git init                 # start tracking a folder
git clone <url>          # copy a project from GitHub
\`\`\`

## The everyday loop

\`\`\`bash
git status               # what changed?
git add .                # stage all changes
git commit -m "Add login page"
git push                 # send commits to GitHub
\`\`\`

## Branches

\`\`\`bash
git switch -c feature/search   # create and switch to a new branch
git switch main                # go back to main
git merge feature/search       # bring the work into main
\`\`\`

Commit small, commit often, and write messages your future self will understand.`,
  },
  {
    author: 'priya',
    title: 'Making Your React App Accessible',
    tags: ['React', 'WebDev'],
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
    daysAgo: 12,
    content: `Accessibility (a11y) means everyone can use your app, including people using keyboards or screen readers.

## Use real elements

A \`<button>\` is focusable and works with the keyboard for free. A \`<div onClick>\` isn't.

\`\`\`jsx
// ❌ Avoid
<div onClick={save}>Save</div>

// ✅ Prefer
<button type="button" onClick={save}>Save</button>
\`\`\`

## Label your inputs

\`\`\`jsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
\`\`\`

## Checklist

- Every image has meaningful \`alt\` text
- Color contrast is high enough
- You can reach everything with the **Tab** key
- Focus styles are visible

Small habits here make a big difference.`,
  },
  {
    author: 'sofia',
    title: 'Draft: My Notes on TypeScript Generics',
    tags: ['TypeScript'],
    status: 'draft',
    daysAgo: 0,
    content: 'This is a **sample draft**. It should only appear in Sofia\'s dashboard, never in the public feed.',
  },
];

// Removes old sample data (only accounts ending in @devblog.sample and their posts),
// then inserts fresh sample data. Real users and their posts are never touched.
export async function seedSampleData() {
  const oldUsers = await User.find({ email: { $regex: `${SAMPLE_EMAIL_DOMAIN.replace('.', '\\.')}$` } });
  const oldIds = oldUsers.map((u) => u._id);
  await Post.deleteMany({ author: { $in: oldIds } });
  await User.deleteMany({ _id: { $in: oldIds } });

  const created = {};
  for (const u of users) {
    const email = `${u.key}${SAMPLE_EMAIL_DOMAIN}`;
    // eslint-disable-next-line no-await-in-loop
    created[u.key] = await User.create({
      name: u.name,
      email,
      password: SAMPLE_PASSWORD,
      username: await uniqueSlug(User, 'username', u.name),
      bio: u.bio,
      avatar: u.avatar,
    });
  }

  for (const p of posts) {
    const status = p.status || 'published';
    const date = new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000);
    const post = new Post({
      title: p.title,
      slug: await uniqueSlug(Post, 'slug', p.title),
      content: p.content,
      excerpt: makeExcerpt(p.content),
      coverImage: p.coverImage || '',
      tags: await syncTags(p.tags),
      status,
      publishedAt: status === 'published' ? date : undefined,
      author: created[p.author]._id,
      // Back-date the sample posts so they look naturally spread over the last few days
      createdAt: date,
      updatedAt: date,
    });
    // eslint-disable-next-line no-await-in-loop
    await post.save({ timestamps: false }); // keep our dates instead of "now"
  }

  // Add friendly descriptions to the tags the posts created
  for (const [slug, description] of Object.entries(tagDescriptions)) {
    // eslint-disable-next-line no-await-in-loop
    await Tag.updateOne({ slug }, { $set: { description } });
  }

  return { users: users.length, posts: posts.length };
}
