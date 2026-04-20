import {
  CreateWorkoutPayload,
  DashboardData,
  ExerciseDetail,
  Goal,
  PersonalBest,
  Workout,
} from '@/types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Exercises ──────────────────────────────────────────────────────────────────

export const getExercises = () => request<string[]>('/exercises');

// ── Workouts ───────────────────────────────────────────────────────────────────

export const getWorkouts = (params?: {
  exercise?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.exercise)  qs.set('exercise',  params.exercise);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate)   qs.set('endDate',   params.endDate);
  if (params?.limit)     qs.set('limit',     String(params.limit));
  const query = qs.toString() ? `?${qs}` : '';
  return request<Workout[]>(`/workouts${query}`);
};

export const createWorkout = (payload: CreateWorkoutPayload) =>
  request<Workout>('/workouts', { method: 'POST', body: JSON.stringify(payload) });

export const updateWorkout = (id: number, payload: Partial<CreateWorkoutPayload>) =>
  request<Workout>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteWorkout = (id: number) =>
  request<void>(`/workouts/${id}`, { method: 'DELETE' });

// ── Stats ──────────────────────────────────────────────────────────────────────

export const getDashboard = () => request<DashboardData>('/stats/dashboard');

export const getExerciseDetail = (exercise: string, params?: {
  startDate?: string;
  endDate?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate)   qs.set('endDate',   params.endDate);
  const query = qs.toString() ? `?${qs}` : '';
  return request<ExerciseDetail>(`/stats/exercise/${encodeURIComponent(exercise)}${query}`);
};

export const getPersonalBests = () => request<PersonalBest[]>('/stats/personal-bests');

// ── Goals ──────────────────────────────────────────────────────────────────────

export const getGoals = () => request<Goal[]>('/goals');

export const setGoal = (exercise: string, goal_one_rm: number) =>
  request<Goal>(`/goals/${encodeURIComponent(exercise)}`, {
    method: 'PUT',
    body: JSON.stringify({ goal_one_rm }),
  });

export const deleteGoal = (exercise: string) =>
  request<void>(`/goals/${encodeURIComponent(exercise)}`, { method: 'DELETE' });
