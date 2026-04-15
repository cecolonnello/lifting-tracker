/**
 * Seed script — generates ~90 days of realistic progressive overload data.
 * Run with:  npm run seed
 */

import db from './database';

interface ExerciseCfg {
  startWeight: number;
  peakWeight:  number;
  repsMin:     number;
  repsMax:     number;
  sessionsIn90Days: number;
}

const EXERCISE_CONFIG: Record<string, ExerciseCfg> = {
  'Barbell Bench Press':          { startWeight: 145, peakWeight: 195, repsMin: 3, repsMax: 8,  sessionsIn90Days: 28 },
  'Incline Dumbbell Bench Press': { startWeight: 50,  peakWeight: 65,  repsMin: 6, repsMax: 12, sessionsIn90Days: 24 },
  'Barbell Shoulder Press':       { startWeight: 85,  peakWeight: 120, repsMin: 4, repsMax: 8,  sessionsIn90Days: 24 },
  'Rope Tricep Extension':        { startWeight: 37,  peakWeight: 55,  repsMin: 8, repsMax: 15, sessionsIn90Days: 22 },
  'Dumbbell Lateral Raise':       { startWeight: 15,  peakWeight: 27,  repsMin: 10,repsMax: 15, sessionsIn90Days: 22 },
  'Dumbbell Skull Crushers':      { startWeight: 25,  peakWeight: 40,  repsMin: 8, repsMax: 12, sessionsIn90Days: 20 },
  'Lat Pulldown':                 { startWeight: 100, peakWeight: 145, repsMin: 6, repsMax: 12, sessionsIn90Days: 28 },
  'Barbell Rows':                 { startWeight: 115, peakWeight: 165, repsMin: 5, repsMax: 10, sessionsIn90Days: 26 },
  'Dumbbell Curls':               { startWeight: 27,  peakWeight: 40,  repsMin: 8, repsMax: 12, sessionsIn90Days: 22 },
  'Dumbbell Hammer Curls':        { startWeight: 30,  peakWeight: 45,  repsMin: 8, repsMax: 12, sessionsIn90Days: 22 },
  'Rear Delt Fly':                { startWeight: 12,  peakWeight: 22,  repsMin: 10,repsMax: 15, sessionsIn90Days: 20 },
  'Reverse Wrist Curls':          { startWeight: 20,  peakWeight: 35,  repsMin: 12,repsMax: 20, sessionsIn90Days: 18 },
  'Barbell Squat':                { startWeight: 185, peakWeight: 255, repsMin: 3, repsMax: 8,  sessionsIn90Days: 26 },
  'Deadlift':                     { startWeight: 225, peakWeight: 315, repsMin: 2, repsMax: 6,  sessionsIn90Days: 22 },
  'Leg Extension':                { startWeight: 90,  peakWeight: 130, repsMin: 10,repsMax: 15, sessionsIn90Days: 22 },
  'Calf Raises':                  { startWeight: 100, peakWeight: 160, repsMin: 12,repsMax: 20, sessionsIn90Days: 22 },
};

// ── Deterministic pseudo-random ───────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: () => number, min: number, max: number) {
  return rng() * (max - min) + min;
}

function snap(w: number) { return Math.round(w / 2.5) * 2.5; }

function calcOneRM(weight: number, reps: number) {
  return parseFloat((weight * (1 + reps / 30)).toFixed(2));
}

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

function randomDates(rng: () => number, count: number, daysBack = 90): string[] {
  const now   = new Date();
  const start = new Date(now.getTime() - daysBack * 86_400_000);
  const range = daysBack * 86_400_000;
  const dates = new Set<string>();
  while (dates.size < count) {
    dates.add(toISO(new Date(start.getTime() + Math.floor(rng() * range))));
  }
  return Array.from(dates).sort();
}

// ── Seed ─────────────────────────────────────────────────────────────────────

function seed() {
  db.exec('DELETE FROM workouts');

  const insert = db.prepare(`
    INSERT INTO workouts (exercise, weight, reps, one_rm, date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // node:sqlite doesn't have a .transaction() helper — use explicit BEGIN/COMMIT
  db.exec('BEGIN');
  try {
    let exerciseIndex = 0;
    for (const [exercise, cfg] of Object.entries(EXERCISE_CONFIG)) {
      const rng = seededRandom(exerciseIndex * 31337 + 7);
      exerciseIndex++;

      const dates = randomDates(rng, cfg.sessionsIn90Days);
      dates.forEach((date, i) => {
        const progress  = i / Math.max(dates.length - 1, 1);
        const trend     = cfg.startWeight + (cfg.peakWeight - cfg.startWeight) * progress;
        const weight    = snap(trend * (1 + randFloat(rng, -0.08, 0.08)));
        const reps      = randInt(rng, cfg.repsMin, cfg.repsMax);
        const one_rm    = calcOneRM(weight, reps);

        insert.run(exercise, weight, reps, one_rm, date, null);
      });
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const result = db.prepare('SELECT COUNT(*) AS n FROM workouts').get() as { n: number };
  console.log(`✅ Seeded ${result.n} workout entries across ${Object.keys(EXERCISE_CONFIG).length} exercises.`);
}

seed();
