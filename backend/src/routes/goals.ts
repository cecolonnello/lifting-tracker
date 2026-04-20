import { Router, Request, Response } from 'express';
import db from '../db/database';
import { Goal } from '../types';

const router = Router();

// ── GET /api/goals ────────────────────────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM goals ORDER BY exercise').all() as Goal[];
  res.json(rows);
});

// ── PUT /api/goals/:exercise ──────────────────────────────────────────────────
// Upsert: creates or updates the goal for an exercise

router.put('/:exercise', (req: Request, res: Response) => {
  const { exercise } = req.params;
  const { goal_one_rm } = req.body as { goal_one_rm: unknown };

  if (typeof goal_one_rm !== 'number' || goal_one_rm <= 0) {
    return res.status(400).json({ error: 'goal_one_rm must be a positive number' });
  }

  db.prepare(`
    INSERT INTO goals (exercise, goal_one_rm, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(exercise) DO UPDATE SET
      goal_one_rm = excluded.goal_one_rm,
      updated_at  = excluded.updated_at
  `).run(exercise, goal_one_rm);

  const row = db.prepare('SELECT * FROM goals WHERE exercise = ?').get(exercise) as Goal;
  res.json(row);
});

// ── DELETE /api/goals/:exercise ───────────────────────────────────────────────

router.delete('/:exercise', (req: Request, res: Response) => {
  const { exercise } = req.params;
  const existing = db.prepare('SELECT * FROM goals WHERE exercise = ?').get(exercise);
  if (!existing) return res.status(404).json({ error: 'No goal set for this exercise' });
  db.prepare('DELETE FROM goals WHERE exercise = ?').run(exercise);
  res.status(204).end();
});

export default router;
