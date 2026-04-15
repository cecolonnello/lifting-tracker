import { Router, Request, Response } from 'express';
import db from '../db/database';
import { CreateWorkoutDto, UpdateWorkoutDto, Workout } from '../types';

const router = Router();

function calcOneRM(weight: number, reps: number): number {
  return parseFloat((weight * (1 + reps / 30)).toFixed(2));
}

function validateWorkoutInput(body: Partial<CreateWorkoutDto>): string | null {
  if (!body.exercise || typeof body.exercise !== 'string') return 'exercise is required';
  if (!body.weight || typeof body.weight !== 'number' || body.weight <= 0) return 'weight must be a positive number';
  if (!body.reps || typeof body.reps !== 'number' || body.reps <= 0 || !Number.isInteger(body.reps)) return 'reps must be a positive integer';
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return 'date must be YYYY-MM-DD';
  return null;
}

// ── GET /api/workouts ─────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const { exercise, startDate, endDate, limit = '200' } = req.query as Record<string, string>;

  let sql = 'SELECT * FROM workouts WHERE 1=1';
  const params: unknown[] = [];

  if (exercise)  { sql += ' AND exercise = ?';  params.push(exercise); }
  if (startDate) { sql += ' AND date >= ?';      params.push(startDate); }
  if (endDate)   { sql += ' AND date <= ?';      params.push(endDate); }

  sql += ' ORDER BY date DESC, created_at DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const rows = db.prepare(sql).all(...params) as Workout[];
  res.json(rows);
});

// ── GET /api/workouts/:id ─────────────────────────────────────────────────────

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id) as Workout | undefined;
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// ── POST /api/workouts ────────────────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  const body = req.body as CreateWorkoutDto;
  const err = validateWorkoutInput(body);
  if (err) return res.status(400).json({ error: err });

  const one_rm = calcOneRM(body.weight, body.reps);

  const result = db.prepare(`
    INSERT INTO workouts (exercise, weight, reps, one_rm, date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(body.exercise, body.weight, body.reps, one_rm, body.date, body.notes ?? null);

  const newId = Number(result.lastInsertRowid);
  const newRow = db.prepare('SELECT * FROM workouts WHERE id = ?').get(newId) as Workout;
  res.status(201).json(newRow);
});

// ── PUT /api/workouts/:id ─────────────────────────────────────────────────────

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id) as Workout | undefined;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const body = req.body as UpdateWorkoutDto;
  const weight   = body.weight   ?? existing.weight;
  const reps     = body.reps     ?? existing.reps;
  const exercise = body.exercise ?? existing.exercise;
  const date     = body.date     ?? existing.date;
  const notes    = body.notes    !== undefined ? body.notes : existing.notes;
  const one_rm   = calcOneRM(weight, reps);

  db.prepare(`
    UPDATE workouts
    SET exercise = ?, weight = ?, reps = ?, one_rm = ?, date = ?, notes = ?
    WHERE id = ?
  `).run(exercise, weight, reps, one_rm, date, notes, req.params.id);

  const row = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id) as Workout;
  res.json(row);
});

// ── DELETE /api/workouts/:id ──────────────────────────────────────────────────

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM workouts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
