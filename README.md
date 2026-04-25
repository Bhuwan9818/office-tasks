# 💧 Office Water Bottle Tracker

A production-ready web app for 3 office users (P1, P2, P3) to manage daily water bottle washing and filling turns — with strict rotation enforcement and real-time state sync.

---

## 🗂️ Project Structure

```
office-tasks/
├── prisma/
│   ├── schema.prisma          # Database schema (MySQL)
│   └── seed.js                # Seed 3 users with hashed passwords
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── login/route.js     # POST /api/login
│   │   │   ├── logout/route.js    # POST /api/logout
│   │   │   ├── status/route.js    # GET  /api/status
│   │   │   ├── wash/route.js      # POST /api/wash
│   │   │   └── fill/route.js      # POST /api/fill
│   │   ├── dashboard/
│   │   │   ├── layout.js
│   │   │   └── page.js            # Main dashboard UI
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js                # Login page
│   ├── lib/
│   │   ├── prisma.js              # Prisma client singleton
│   │   ├── session.js             # iron-session helpers
│   │   └── taskLogic.js           # Pure business logic functions
│   └── middleware.js              # Auth-based route protection
├── .env.example
├── jsconfig.json
├── next.config.js
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

---

## ⚙️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router) + Tailwind  |
| Backend     | Next.js API Routes                  |
| Database    | MySQL via Prisma ORM                |
| Auth        | iron-session (encrypted cookies)    |
| Deployment  | Vercel (free tier compatible)       |

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd office-tasks
npm install
```

### 2. Set Up MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE office_tasks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/office_tasks"
SESSION_SECRET="your-32-character-random-secret-here"
NODE_ENV="development"
```

Generate a secure session secret:
```bash
openssl rand -hex 32
```

### 4. Push Schema & Seed Database

```bash
# Push schema to MySQL (creates tables)
npm run db:push

# Seed 3 users
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👥 Default Login Credentials

| User | Email           | Password  |
|------|-----------------|-----------|
| P1   | p1@office.com   | pass1234  |
| P2   | p2@office.com   | pass1234  |
| P3   | p3@office.com   | pass1234  |

> ⚠️ Change passwords in production by re-running the seed with new values.

---

## 📅 Business Logic

### Washing Rotation (fixed by day of week)
```
Monday    → P1
Tuesday   → P2
Wednesday → P3
Thursday  → P1
Friday    → P2
Saturday  → P3
Sunday    → P3
```

- Only the **assigned washer** can click "Mark as Washed"
- Can only be marked once per day
- Enforced server-side — no client manipulation possible

### Filling Rotation (strict sequential)
- Fill order **starts from the washer** and cycles through all 3 users
- Example: If P2 washes → fills go P2 → P3 → P1 → P2 → P3 → P1 → ...
- The **Fill Water button is disabled** for non-turn users
- **Race condition protected** via DB unique constraint on `(date, orderIndex)`
- Enforced server-side with re-read of fill count before every insert

---

## 🗄️ Database Schema

### `User`
| Column    | Type     | Notes             |
|-----------|----------|-------------------|
| id        | Int      | Auto-increment PK |
| name      | String   | P1, P2, P3        |
| email     | String   | Unique            |
| password  | String   | Bcrypt hashed     |
| createdAt | DateTime |                   |

### `DailyTask`
| Column    | Type     | Notes                   |
|-----------|----------|-------------------------|
| id        | Int      | Auto-increment PK       |
| date      | String   | YYYY-MM-DD, unique      |
| washerId  | Int      | FK → User               |
| isWashed  | Boolean  | Default false           |
| washedAt  | DateTime | Nullable                |

### `FillLog`
| Column      | Type     | Notes                          |
|-------------|----------|--------------------------------|
| id          | Int      | Auto-increment PK              |
| date        | String   | YYYY-MM-DD                     |
| userId      | Int      | FK → User                      |
| orderIndex  | Int      | 1, 2, 3, ... fill sequence     |
| filledAt    | DateTime | Default now()                  |
| dailyTaskId | Int      | FK → DailyTask                 |

Unique constraint: `(date, orderIndex)` — prevents race conditions.

---

## 🔐 API Endpoints

| Method | Path         | Auth | Description                       |
|--------|--------------|------|-----------------------------------|
| POST   | /api/login   | No   | Email + password → sets cookie    |
| POST   | /api/logout  | Yes  | Clears session cookie             |
| GET    | /api/status  | Yes  | Full day status + fill history    |
| POST   | /api/wash    | Yes  | Mark bottle washed (washer only)  |
| POST   | /api/fill    | Yes  | Log a water fill (turn-based)     |

---

## ☁️ Vercel Deployment

### Prerequisites
- A **MySQL database** accessible from Vercel (see options below)
- A Vercel account

### Recommended Free MySQL Hosts for Vercel
- **[PlanetScale](https://planetscale.com)** — generous free tier, serverless MySQL
- **[Railway](https://railway.app)** — $5/month after free tier
- **[Aiven](https://aiven.io)** — free trial
- **[TiDB Cloud](https://tidbcloud.com)** — free serverless MySQL-compatible

### Deploy Steps

1. **Push code to GitHub**
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/office-tasks
   git push -u origin main
   ```

2. **Import project on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Framework: **Next.js** (auto-detected)

3. **Set Environment Variables on Vercel**
   In Vercel → Project → Settings → Environment Variables, add:
   ```
   DATABASE_URL      = mysql://user:pass@host:port/office_tasks
   SESSION_SECRET    = your-32-char-random-secret
   NODE_ENV          = production
   ```

4. **Run DB migration after first deploy**
   
   Via Vercel CLI:
   ```bash
   npx vercel env pull .env.production.local
   npx prisma db push
   node prisma/seed.js
   ```

5. **Deploy** — Vercel auto-deploys on every push to `main`

---

## 🛡️ Security Notes

- Passwords stored as **bcrypt hashes** (cost factor 10)
- Sessions are **encrypted with iron-session** (AES-256 via the SESSION_SECRET)
- All business logic validated **server-side** — client cannot bypass turn enforcement
- Race conditions prevented by **DB-level unique constraint** on fill order
- Session cookie is **httpOnly + sameSite=lax** (CSRF resistant)

---

## 🔄 How Polling Works

The dashboard polls `GET /api/status` every **15 seconds** automatically. When any user takes an action (wash or fill), all other users see the updated state within 15 seconds — no manual refresh needed.

---

## 🐛 Troubleshooting

**`DATABASE_URL` errors on Vercel**
→ Make sure the MySQL host allows connections from Vercel's IP ranges (or use `0.0.0.0/0` in PlanetScale/Railway)

**Session not persisting**
→ Verify `SESSION_SECRET` is set and is at least 32 characters

**Prisma client not found after deploy**
→ The `build` script runs `prisma generate` automatically — ensure it's in `package.json`

**Fill button always disabled**
→ Check that users are seeded in correct order (P1, P2, P3) in the DB
