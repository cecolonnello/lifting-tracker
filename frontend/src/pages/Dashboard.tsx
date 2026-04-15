import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Activity,
  Dumbbell,
  Trophy,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Flame,
  Calendar,
} from 'lucide-react';
import { getDashboard } from '@/api/client';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
      <Dumbbell size={40} strokeWidth={1} />
      <p>Could not load dashboard. Is the backend running?</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link to="/log">
          <Button size="md">
            <PlusCircle size={15} />
            Log Workout
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Workouts"
          value={data.total_workouts}
          sub="all time"
          icon={<Activity size={15} />}
        />
        <StatCard
          label="This Week"
          value={data.workouts_this_week}
          sub="sessions logged"
          icon={<Calendar size={15} />}
        />
        <StatCard
          label="This Month"
          value={data.workouts_this_month}
          sub="sessions logged"
          icon={<Flame size={15} />}
        />
        <StatCard
          label="Exercises Tracked"
          value={data.unique_exercises}
          sub="unique lifts"
          icon={<Dumbbell size={15} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workouts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <div>
                <CardTitle>Recent Workouts</CardTitle>
                <CardDescription>Your last 10 logged sets</CardDescription>
              </div>
              <Link to="/progress" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors">
                View all <ArrowRight size={13} />
              </Link>
            </CardHeader>
            {data.recent_workouts.length === 0 ? (
              <EmptyState message="No workouts logged yet" />
            ) : (
              <div className="flex flex-col gap-2">
                {data.recent_workouts.map(w => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Dumbbell size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{w.exercise}</p>
                      <p className="text-gray-500 text-xs">
                        {w.weight} lbs × {w.reps} reps
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-blue-400 text-sm font-semibold">{w.one_rm.toFixed(1)} lbs</p>
                      <p className="text-gray-600 text-xs">{format(parseISO(w.date), 'MMM d')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Top Progressing */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" />
                Top Gains
              </CardTitle>
              <CardDescription>Biggest 1RM improvement</CardDescription>
            </CardHeader>
            {data.top_progressing.length === 0 ? (
              <EmptyState message="Log more data to see trends" />
            ) : (
              <div className="flex flex-col gap-3">
                {data.top_progressing.map((ex, i) => (
                  <Link
                    key={ex.exercise}
                    to={`/progress/${encodeURIComponent(ex.exercise)}`}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors group"
                  >
                    <span className="text-xs font-bold text-gray-600 w-4 shrink-0 mt-0.5">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">
                        {ex.exercise}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {ex.total_sessions} sessions
                      </p>
                    </div>
                    <Badge variant={ex.improvement_pct >= 0 ? 'green' : 'red'}>
                      +{ex.improvement_pct.toFixed(1)}%
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Personal Bests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy size={16} className="text-blue-400" />
            Personal Bests — Estimated 1RM
          </CardTitle>
          <CardDescription>Your highest ever estimated 1-rep max per exercise</CardDescription>
        </CardHeader>
        {data.personal_bests.length === 0 ? (
          <EmptyState message="No personal bests yet. Start logging!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.personal_bests.map(pb => (
              <Link
                key={pb.exercise}
                to={`/progress/${encodeURIComponent(pb.exercise)}`}
                className="flex flex-col gap-1.5 p-3.5 rounded-lg bg-surface hover:bg-white/5 border border-border hover:border-blue-600/30 transition-all"
              >
                <p className="text-xs text-gray-500 truncate">{pb.exercise}</p>
                <p className="text-white font-bold text-lg leading-none">
                  {pb.one_rm.toFixed(1)}
                  <span className="text-gray-500 font-normal text-sm ml-1">lbs</span>
                </p>
                <p className="text-gray-600 text-xs">
                  {pb.weight} lbs × {pb.reps} reps · {format(parseISO(pb.date), 'MMM d')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-20 text-gray-600 text-sm">
      {message}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-card rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-card rounded-xl" />
        <div className="h-64 bg-card rounded-xl" />
      </div>
    </div>
  );
}
