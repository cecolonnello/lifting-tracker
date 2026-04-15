export interface Workout {
  id: number;
  exercise: string;
  weight: number;
  reps: number;
  one_rm: number;
  date: string;       // ISO date string: YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

export interface CreateWorkoutDto {
  exercise: string;
  weight: number;
  reps: number;
  date: string;
  notes?: string | null;
}

export type UpdateWorkoutDto = Partial<CreateWorkoutDto>;

export interface PersonalBest {
  exercise: string;
  one_rm: number;
  weight: number;
  reps: number;
  date: string;
}

export interface ExerciseStats {
  exercise: string;
  total_sessions: number;
  latest_one_rm: number;
  best_one_rm: number;
  first_date: string;
  last_date: string;
  improvement_lbs: number;
  improvement_pct: number;
}

export interface DashboardData {
  total_workouts: number;
  workouts_this_week: number;
  workouts_this_month: number;
  unique_exercises: number;
  recent_workouts: Workout[];
  personal_bests: PersonalBest[];
  top_progressing: ExerciseStats[];
}
