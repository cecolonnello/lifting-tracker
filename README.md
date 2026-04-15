# IronLog — Gym Lift Tracker

A full-stack gym tracking app built with **React + Vite** (frontend) and **Node.js + Express** (backend), backed by **SQLite**.

Track your workouts, auto-calculate estimated 1RM with the Epley formula, and visualize progressive overload over time.

---

## Tech Stack

| Layer     | Tech                                         |
|-----------|----------------------------------------------|
| Frontend  | React 18, Vite, TypeScript, Tailwind CSS     |
| Charts    | Recharts                                     |
| Data      | TanStack Query (React Query v5)              |
| Routing   | React Router v6                              |
| Backend   | Node.js, Express, TypeScript                 |
| Database  | SQLite via `better-sqlite3`                  |
| Dev runner| `tsx` (TypeScript execution, no compile step)|

---

## Quick Start

### Prerequisites

- **Node.js ≥ 18** (check with `node -v`)
- **npm ≥ 9**

---

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
```

The defaults work out of the box:

```
PORT=3001
DB_PATH=./data/lifting.db
NODE_ENV=development
```

---

### 3. Seed the Database

This generates ~90 days of realistic progressive overload data for all 16 exercises so charts are populated immediately.

```bash
cd backend
npm run seed
```

Output: `✅ Seeded N workout entries across 16 exercises.`

---

### 4. Start the Backend

```bash
# Still in /backend
npm run dev
# → 🏋️  Lifting Tracker API running on http://localhost:3001
```

---

### 5. Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
# → Local: http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Pages

| Route               | Description                                      |
|---------------------|--------------------------------------------------|
| `/`                 | Dashboard — stats, recent workouts, personal bests |
| `/log`              | Log a workout — live 1RM preview as you type     |
| `/progress`         | All exercises grouped by Push / Pull / Legs       |
| `/progress/:name`   | Exercise detail — chart, stats, full history with edit/delete |
| `/analytics`        | Top PRs bar chart, exercise trend drill-down, volume heatmap |

---

## 1RM Formula

```
Estimated 1RM = weight × (1 + reps ÷ 30)
```

This is the **Epley formula**. Every set you log gets its 1RM calculated and stored automatically. All progress charts track this value so you can see progressive overload even when reps and weights vary session to session.

---

## API Reference

Base URL: `http://localhost:3001`

### Workouts

| Method | Path                  | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/api/workouts`       | List workouts (filterable)   |
| POST   | `/api/workouts`       | Create a workout entry       |
| PUT    | `/api/workouts/:id`   | Update a workout entry       |
| DELETE | `/api/workouts/:id`   | Delete a workout entry       |

Query params for `GET /api/workouts`: `exercise`, `startDate` (YYYY-MM-DD), `endDate`, `limit`

#### POST /api/workouts body

```json
{
  "exercise": "Barbell Bench Press",
  "weight": 185,
  "reps": 5,
  "date": "2026-04-16",
  "notes": "felt strong"
}
```

### Stats

| Method | Path                            | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/api/stats/dashboard`          | Dashboard summary              |
| GET    | `/api/stats/personal-bests`     | All-time PRs per exercise      |
| GET    | `/api/stats/exercise/:exercise` | Stats + history for one lift   |
| GET    | `/api/exercises`                | List of all supported exercises|

---

## Database Schema

```sql
CREATE TABLE workouts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise   TEXT    NOT NULL,
  weight     REAL    NOT NULL CHECK (weight > 0),
  reps       INTEGER NOT NULL CHECK (reps > 0),
  one_rm     REAL    NOT NULL,        -- auto-calculated via Epley formula
  date       TEXT    NOT NULL,        -- YYYY-MM-DD
  notes      TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

## Project Structure

```
lifting-tracker/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts     # SQLite init + schema
│   │   │   └── seed.ts         # Sample data generator
│   │   ├── routes/
│   │   │   ├── workouts.ts     # CRUD endpoints
│   │   │   └── stats.ts        # Analytics endpoints
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts           # Express app + startup
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.ts       # Typed fetch wrappers
    │   ├── components/
    │   │   ├── charts/
    │   │   │   └── OneRMChart.tsx
    │   │   ├── layout/
    │   │   │   ├── Layout.tsx
    │   │   │   └── Navbar.tsx
    │   │   └── ui/
    │   │       ├── Badge.tsx
    │   │       ├── Button.tsx
    │   │       ├── Card.tsx
    │   │       ├── Input.tsx
    │   │       ├── Select.tsx
    │   │       └── StatCard.tsx
    │   ├── pages/
    │   │   ├── Analytics.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── ExerciseDetail.tsx
    │   │   ├── ExerciseProgress.tsx
    │   │   └── LogWorkout.tsx
    │   ├── types/
    │   │   └── index.ts
    │   └── App.tsx
    └── package.json
```

---

## Production Build

```bash
# Build backend
cd backend && npm run build
node dist/server.js

# Build frontend
cd frontend && npm run build
# Serve dist/ with any static file server or Nginx
```

---

## Re-seeding

To reset and regenerate all sample data:

```bash
cd backend
npm run seed
```

> ⚠️ This deletes all existing workout entries and regenerates seed data.
