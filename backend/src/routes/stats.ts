import { Router, Request, Response } from 'express';
import db from '../db/database';
import { DashboardData, ExerciseStats, PersonalBest, Workout } from '../types';

const router = Router();

// ── Helper: ISO week boundary ─────────────────────────────────────────────────

function isoMonday(d: Date): string {
  const day = d.getDay(); // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ── GET /api/stats/dashboard ──────────────────────────────────────────────────

router.get('/dashboard', (_req: Request, res: Response) => {
  const today = new Date();
  const weekStart  = isoMonday(today);
  const monthStart = firstOfMonth();

  const total = (db.prepare('SELECT COUNT(*) AS n FROM workouts').get() as { n: number }).n;
  const thisWeek  = (db.prepare('SELECT COUNT(*) AS n FROM workouts WHERE date >= ?').get(weekStart)  as { n: number }).n;
  const thisMonth = (db.prepare('SELECT COUNT(*) AS n FROM workouts WHERE date >= ?').get(monthStart) as { n: number }).n;
  const uniqueEx  = (db.prepare('SELECT COUNT(DISTINCT exercise) AS n FROM workouts').get() as { n: number }).n;

  // Last 10 workouts
  const recent = db.prepare('SELECT * FROM workouts ORDER BY date DESC, created_at DESC LIMIT 10').all() as Workout[];

  // Personal bests: highest one_rm per exercise
  const pbs = db.prepare(`
    SELECT exercise, weight, reps, one_rm, date
    FROM workouts w
    WHERE one_rm = (SELECT MAX(one_rm) FROM workouts WHERE exercise = w.exercise)
    GROUP BY exercise
    ORDER BY exercise
  `).all() as PersonalBest[];

  // Top progressing exercises: biggest one_rm improvement % (need ≥3 sessions)
  const exerciseStats = db.prepare(`
    SELECT
      exercise,
      COUNT(*)           AS total_sessions,
      MIN(one_rm)        AS first_one_rm,
      MAX(one_rm)        AS best_one_rm,
      MIN(date)          AS first_date,
      MAX(date)          AS last_date
    FROM workouts
    GROUP BY exercise
    HAVING total_sessions >= 3
    ORDER BY (MAX(one_rm) - MIN(one_rm)) DESC
    LIMIT 5
  `).all() as { exercise: string; total_sessions: number; first_one_rm: number; best_one_rm: number; first_date: string; last_date: string }[];

  const top_progressing: ExerciseStats[] = exerciseStats.map(r => ({
    exercise:         r.exercise,
    total_sessions:   r.total_sessions,
    latest_one_rm:    r.best_one_rm,   // approximate — last best
    best_one_rm:      r.best_one_rm,
    first_date:       r.first_date,
    last_date:        r.last_date,
    improvement_lbs:  parseFloat((r.best_one_rm - r.first_one_rm).toFixed(2)),
    improvement_pct:  parseFloat((((r.best_one_rm - r.first_one_rm) / r.first_one_rm) * 100).toFixed(1)),
  }));

  const data: DashboardData = {
    total_workouts:    total,
    workouts_this_week:  thisWeek,
    workouts_this_month: thisMonth,
    unique_exercises:    uniqueEx,
    recent_workouts:     recent,
    personal_bests:      pbs,
    top_progressing,
  };

  res.json(data);
});

// ── GET /api/stats/exercise/:exercise ─────────────────────────────────────────
// Detailed stats + history for a single exercise

router.get('/exercise/:exercise', (req: Request, res: Response) => {
  const { exercise } = req.params;
  const { startDate, endDate } = req.query as Record<string, string>;

  let sql = 'SELECT * FROM workouts WHERE exercise = ?';
  const params: (string | number)[] = [exercise];

  if (startDate) { sql += ' AND date >= ?'; params.push(startDate); }
  if (endDate)   { sql += ' AND date <= ?'; params.push(endDate); }

  sql += ' ORDER BY date ASC, created_at ASC';

  const history = db.prepare(sql).all(...params) as Workout[];
  if (!history.length) return res.json({ history: [], stats: null });

  const one_rms    = history.map(h => h.one_rm);
  const best_one_rm = Math.max(...one_rms);
  const latest     = history[history.length - 1];
  const first      = history[0];

  const stats: ExerciseStats = {
    exercise,
    total_sessions:  history.length,
    latest_one_rm:   latest.one_rm,
    best_one_rm,
    first_date:      first.date,
    last_date:       latest.date,
    improvement_lbs: parseFloat((best_one_rm - first.one_rm).toFixed(2)),
    improvement_pct: parseFloat((((best_one_rm - first.one_rm) / first.one_rm) * 100).toFixed(1)),
  };

  res.json({ history, stats });
});

// ── GET /api/stats/personal-bests ─────────────────────────────────────────────

router.get('/personal-bests', (_req: Request, res: Response) => {
  const pbs = db.prepare(`
    SELECT exercise, weight, reps, one_rm, date
    FROM workouts w
    WHERE one_rm = (SELECT MAX(one_rm) FROM workouts WHERE exercise = w.exercise)
    GROUP BY exercise
    ORDER BY one_rm DESC
  `).all() as PersonalBest[];

  res.json(pbs);
});

export default router;
