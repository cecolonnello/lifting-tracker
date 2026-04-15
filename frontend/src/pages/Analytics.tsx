import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { BarChart2, TrendingUp, Dumbbell } from 'lucide-react';
import { getPersonalBests, getWorkouts } from '@/api/client';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import OneRMChart from '@/components/charts/OneRMChart';

const COMPARE_EXERCISES = [
  'Barbell Bench Press',
  'Barbell Squat',
  'Deadlift',
  'Barbell Rows',
  'Barbell Shoulder Press',
  'Lat Pulldown',
];

const RANGE_OPTIONS = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

// Custom tooltip for bar chart
function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { exercise: string; one_rm: number; weight: number; reps: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-white font-semibold mb-1 max-w-[160px]">{d.exercise}</p>
      <p className="text-blue-400 font-bold">{d.one_rm.toFixed(1)} lbs 1RM</p>
      <p className="text-gray-500">{d.weight} lbs × {d.reps} reps</p>
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState(90);
  const [selectedExercise, setSelectedExercise] = useState(COMPARE_EXERCISES[0]);

  const startDate = format(subDays(new Date(), range), 'yyyy-MM-dd');

  const { data: pbs = [] } = useQuery({
    queryKey: ['personal-bests'],
    queryFn: getPersonalBests,
  });

  const { data: exerciseWorkouts = [], isLoading: loadingExercise } = useQuery({
    queryKey: ['workouts', selectedExercise, startDate],
    queryFn: () => getWorkouts({ exercise: selectedExercise, startDate, limit: 200 }),
  });

  // Volume by day (# sets in last 30 days)
  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ['workouts-recent-30'],
    queryFn: () => getWorkouts({ startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), limit: 500 }),
  });

  // Group volume by date
  const volumeByDate = recentWorkouts.reduce<Record<string, number>>((acc, w) => {
    acc[w.date] = (acc[w.date] ?? 0) + 1;
    return acc;
  }, {});

  const volumeChartData = Object.entries(volumeByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sets]) => ({ date, sets }));

  // Top 10 exercises by best 1RM for bar chart
  const top10 = pbs.slice(0, 10).map(p => ({
    exercise: p.exercise.replace('Barbell ', '').replace('Dumbbell ', '').replace(' Press', ' Pr.'),
    fullName: p.exercise,
    one_rm: p.one_rm,
    weight: p.weight,
    reps: p.reps,
  }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Training insights and trends across all your lifts
        </p>
      </div>

      {/* Top PRs bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-400" />
            Personal Bests — Top 10 by Estimated 1RM
          </CardTitle>
          <CardDescription>Your absolute best estimated 1RM per exercise</CardDescription>
        </CardHeader>
        {pbs.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="exercise"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={44}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dx={-2}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="one_rm" radius={[4, 4, 0, 0]}>
                {top10.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#3b82f6' : '#1d4ed8'} fillOpacity={1 - i * 0.06} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Single exercise drill-down */}
      <Card>
        <CardHeader className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" />
              Exercise Trend
            </CardTitle>
            <CardDescription>1RM progress over time for a selected lift</CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Exercise selector */}
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="bg-surface border border-border text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500/60"
            >
              {COMPARE_EXERCISES.map(ex => (
                <option key={ex} value={ex} className="bg-surface">
                  {ex}
                </option>
              ))}
            </select>

            {/* Range selector */}
            <div className="flex gap-1">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setRange(opt.days)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    range === opt.days
                      ? 'bg-blue-600 text-white'
                      : 'bg-surface text-gray-400 hover:text-white border border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        {loadingExercise ? (
          <div className="h-64 bg-surface/50 rounded-lg animate-pulse" />
        ) : (
          <OneRMChart data={exerciseWorkouts} height={280} />
        )}
      </Card>

      {/* Volume heatmap (sets/day) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell size={16} className="text-blue-400" />
            Training Volume — Last 30 Days
          </CardTitle>
          <CardDescription>Sets logged per session</CardDescription>
        </CardHeader>
        {volumeChartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={volumeChartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={v => {
                  try { return format(parseISO(v), 'M/d'); } catch { return v; }
                }}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dx={-2}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs shadow-2xl">
                      <p className="text-gray-400">{label ? format(parseISO(label as string), 'MMM d, yyyy') : ''}</p>
                      <p className="text-white font-bold">{payload[0].value} sets</p>
                    </div>
                  );
                }}
                cursor={{ fill: '#ffffff08' }}
              />
              <Bar dataKey="sets" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
