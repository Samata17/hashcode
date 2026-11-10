# DevBlog

A developer blogging platform where people write Markdown articles with code highlighting, save drafts, publish, and build a public profile. Inspired by Hashnode.

**Stack:** React (Vite) · React Router · Axios · Node.js · Express · MongoDB (Mongoose) · JWT · bcryptjs · React Markdown · React Syntax Highlighter

---

## Features

**Reading**
- Home feed with a featured article, latest articles, "Load more", trending tags and authors
- Search by title and filter by tag
- Article pages with readable URLs (`/post/my-first-article`), Markdown, tables and highlighted code with a Copy button
- Tags page with post counts, one page per tag, and public author profiles

**Writing**
- Register, log in, log out, and stay logged in after refreshing the page
- Markdown editor with a formatting toolbar and Write / Preview / Side-by-side views
- Title, cover image URL, up to 5 tags, and an optional summary
- Save as draft or publish; unpublish later
- Dashboard with all your posts, filters, and delete with confirmation
- Edit profile (name, bio, avatar)

**Security** (all checked on the server, not just in the browser)
- Passwords are hashed with bcrypt and never returned by the API
- JWT authentication on all private routes
- Only a post's author can edit or delete it (otherwise `403 Forbidden`)
- Drafts never appear in the feed, search, tags, or profiles, and only the author can open them
- The post author always comes from the login token, never from the request body
- Input validation on both the frontend and the backend
- Login and register are rate-limited (30 attempts per 15 minutes per IP)
- Markdown is rendered without raw HTML, so articles can't inject scripts

---

## Project structure

```
hashcode/
├── backend/                 Express REST API
│   ├── src/
│   │   ├── config/db.js         MongoDB connection
│   │   ├── models/              User, Post, Tag (Mongoose schemas)
│   │   ├── controllers/         What each endpoint does
│   │   ├── routes/              URLs + input validation rules
│   │   ├── middleware/          auth (JWT), validation, error handling
│   │   ├── utils/               tokens, slugs, tags, text helpers
│   │   ├── seed/sampleData.js   SAMPLE data (clearly marked)
│   │   ├── app.js               Builds the Express app
│   │   └── server.js            Starts the server
│   ├── scripts/
│   │   ├── seed.js              npm run seed
│   │   └── dev-memory.js        npm run dev:memory (no MongoDB needed)
│   ├── tests/                   API tests (temporary in-memory database)
│   └── .env.example
├── frontend/                React app (Vite)
│   └── src/
│       ├── api/client.js        Axios setup + error helpers
│       ├── context/             AuthContext (login state), ToastContext (pop-up messages)
│       ├── components/          Navbar, PostCard, MarkdownRenderer, ...
│       ├── hooks/               usePostFeed (feed + pagination)
│       ├── pages/               One file per page
│       ├── utils/               Formatting + form validation
│       └── styles/index.css     All styles
├── e2e/run.mjs              Browser test (clicks through the whole app)
├── render.yaml              One-click deploy settings for Render
└── package.json             Root scripts (build, start, test)
```

---

## Running it on your computer

### 1. Requirements
- **Node.js 20.19 or newer** ([download](https://nodejs.org)). Check with `node -v`.
- **A MongoDB database.** Pick one:
  - **MongoDB Atlas** (free, online, easiest). See [Setting up MongoDB Atlas](#setting-up-mongodb-atlas) below.
  - **MongoDB Community Server** installed on your computer ([download](https://www.mongodb.com/try/download/community)).
  - **None yet?** You can still try the app with `npm run dev:memory` (see step 4).

### 2. Install
From the project folder:
```bash
npm run install:all
```

### 3. Configure the backend
Copy `backend/.env.example` to `backend/.env` and fill it in:

| Variable | What it is |
|---|---|
| `MONGO_URI` | Your database address, e.g. `mongodb://127.0.0.1:27017/devblog` or your Atlas string |
| `JWT_SECRET` | A long random secret. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | How long a login lasts, e.g. `7d` |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Where the React app runs in development (default `http://localhost:5173`) |

> Never commit `.env`. It's already listed in `.gitignore`.

### 4. Start (two terminals)

**Terminal 1: backend**
```bash
cd backend
npm run dev          # uses your real MongoDB (data is saved)
# or
npm run dev:memory   # temporary database with sample data, erased when you stop it
```

**Terminal 2: frontend**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**.

### 5. Optional: add sample data to your real database
```bash
npm run seed
```
This adds 3 **sample** authors and 7 **sample** posts (one is a draft). Every sample account has an email ending in `@devblog.sample` and the password `password123`, for example `priya@devblog.sample`. Running it again replaces only the sample accounts; your own users and posts are never touched.

---

## Testing

```bash
npm test            # 29 API tests (no MongoDB needed; uses a temporary database)
```

```bash
# Browser test: clicks through the whole app in Edge or Chrome.
# First start: backend "npm run dev:memory" + frontend "npm run dev"
npm run test:e2e
```
The browser test signs up, writes, saves a draft, publishes, edits, and deletes a post. It also checks the security rules, the mobile layout, and the browser console for errors. Screenshots go to `e2e/screenshots/`.

---

## API reference

Base URL: `/api`. Private routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account `{ name, email, password }` |
| POST | `/auth/login` | Public | Log in `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Private | The logged-in user |
| GET | `/posts` | Public | Published posts. Query: `search`, `tag`, `author`, `page`, `limit` |
| GET | `/posts/:slug` | Public* | One post (*drafts only for their author) |
| GET | `/posts/mine` | Private | All my posts, including drafts |
| GET | `/posts/edit/:id` | Author | A post for the edit form |
| POST | `/posts` | Private | Create `{ title, content, coverImage?, excerpt?, tags?, status? }` |
| PUT | `/posts/:id` | Author | Update any of the fields above |
| DELETE | `/posts/:id` | Author | Delete a post |
| GET | `/tags` | Public | Tags with published post counts |
| GET | `/tags/:slug` | Public | One tag |
| GET | `/users/:username` | Public | Public profile + published posts |
| PUT | `/users/me` | Private | Update `{ name?, bio?, avatar? }` |

Errors always look like `{ "message": "...", "errors": [{ "field": "...", "message": "..." }] }`.

---

## Putting it on GitHub

1. Install **Git**: https://git-scm.com/download/win (keep the default options), then reopen VS Code.
2. Create an **empty** repository on https://github.com/new (no README, no .gitignore).
3. In the project folder, run:
```bash
git init
git add .
git status                      # check that NO .env file and NO node_modules are listed
git commit -m "Initial commit: DevBlog"
git branch -M main
git remote add origin https://github.com/<your-username>/devblog.git
git push -u origin main
```

---

## Deploying (free): MongoDB Atlas + Render

In production, the Express server also serves the built React site, so the whole app is **one service at one address**.

### Setting up MongoDB Atlas
1. Sign up at https://www.mongodb.com/cloud/atlas and create a free **M0** cluster.
2. **Database Access:** add a database user with a password.
3. **Network Access:** add `0.0.0.0/0`. This is needed for Render, whose server addresses change.
4. **Connect → Drivers:** copy the connection string. Replace `<password>` with your password and add the database name before the `?`:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/devblog?retryWrites=true&w=majority`
5. For local use, put it in `backend/.env` as `MONGO_URI`.

### Deploying on Render
1. Push the project to GitHub (see above).
2. On https://render.com: **New → Blueprint**, then pick your repository. Render reads `render.yaml`.
3. When asked, paste your Atlas connection string as **MONGO_URI**. `JWT_SECRET` is generated for you automatically.
4. Wait for the build, then open the URL Render gives you (`https://devblog-xxxx.onrender.com`).
5. Optional: to add sample data, run `npm run seed` on your computer with the Atlas `MONGO_URI` in `backend/.env`.

<details>
<summary>Manual setup instead of the Blueprint</summary>

New → Web Service → your repo, then:
- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment variables:** `NODE_ENV=production`, `MONGO_URI=<atlas string>`, `JWT_SECRET=<48+ random characters>`, `JWT_EXPIRES_IN=7d`
</details>

> Render's free plan "sleeps" after 15 minutes without visitors, so the first page load afterwards can take about 30 seconds.

**Hosting the frontend separately** (e.g. on Netlify or Vercel): set `VITE_API_URL=https://your-api.example.com/api` when building the frontend, and set `CLIENT_URL` on the backend to the frontend's address so CORS allows it.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `connect ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running. Start it, use an Atlas `MONGO_URI`, or use `npm run dev:memory` |
| `MongoServerSelectionError` with Atlas | Check the password in `MONGO_URI`, and that your IP (or `0.0.0.0/0`) is allowed in Network Access |
| Page says "Cannot reach the server" | The backend isn't running on port 5000 |
| `JWT_SECRET is too weak for production` | Use a random secret of at least 32 characters |
| "Too many attempts" when logging in | Rate limit: wait 15 minutes, or restart the backend during development |
| First `npm test` or `dev:memory` is slow | It downloads a MongoDB test binary once (~100 MB) |
| Port already in use | Another copy is running. Close it, or change `PORT` in `backend/.env` |

---

## How it works (quick tour)

1. **Logging in:** the backend checks the password with bcrypt and returns a signed **JWT**. The browser keeps only that token and sends it with every request. On page load, `AuthContext` calls `/api/auth/me` to restore your session.
2. **Protecting data:** the `protect` middleware verifies the token. `findOwnPost` in `postController.js` checks that you're the author before any edit or delete.
3. **Drafts:** every public query includes `status: 'published'`. Only `/posts/mine` and the author's own article page can see drafts.
4. **Slugs:** titles become URLs (`"Hello World!"` → `hello-world`). Duplicates get `-2`, `-3`, and so on. A post's URL stays fixed once it's published, so shared links keep working.

## License
MIT
