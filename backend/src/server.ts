import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workoutsRouter from './routes/workouts';
import statsRouter from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/workouts', workoutsRouter);
app.use('/api/stats', statsRouter);

// List of valid exercises — single source of truth exposed to the frontend
app.get('/api/exercises', (_req, res) => {
  res.json([
    'Barbell Bench Press',
    'Incline Dumbbell Bench Press',
    'Barbell Shoulder Press',
    'Rope Tricep Extension',
    'Dumbbell Lateral Raise',
    'Dumbbell Skull Crushers',
    'Lat Pulldown',
    'Barbell Rows',
    'Dumbbell Curls',
    'Dumbbell Hammer Curls',
    'Rear Delt Fly',
    'Reverse Wrist Curls',
    'Barbell Squat',
    'Deadlift',
    'Leg Extension',
    'Calf Raises',
  ]);
});

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🏋️  Lifting Tracker API running on http://localhost:${PORT}`);
});

export default app;
