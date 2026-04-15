import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Trophy,
  Activity,
  TrendingUp,
  Calendar,
  Trash2,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { getExerciseDetail, deleteWorkout, updateWorkout } from '@/api/client';
import OneRMChart from '@/components/charts/OneRMChart';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Workout } from '@/types';

const RANGE_OPTIONS = [
  { label: '30d',  days: 30  },
  { label: '60d',  days: 60  },
  { label: '90d',  days: 90  },
  { label: 'All',  days: 0   },
];

export default function ExerciseDetail() {
  const { exercise } = useParams<{ exercise: string }>();
  const decoded = decodeURIComponent(exercise ?? '');
  const queryClient = useQueryClient();

  const [range, setRange] = useState(0); // 0 = all
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ weight: '', reps: '', notes: '' });

  const startDate = range > 0
    ? format(subDays(new Date(), range), 'yyyy-MM-dd')
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['exercise-detail', decoded, startDate],
    queryFn: () => getExerciseDetail(decoded, { startDate }),
    enabled: !!decoded,
  });

  const deleteMut = useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      toast.success('Entry deleted');
      queryClient.invalidateQueries({ queryKey: ['exercise-detail', decoded] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['personal-bests'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { weight: number; reps: number; notes: string | null } }) =>
      updateWorkout(id, payload),
    onSuccess: () => {
      toast.success('Entry updated');
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['exercise-detail', decoded] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['personal-bests'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  function startEdit(w: Workout) {
    setEditId(w.id);
    setEditForm({ weight: String(w.weight), reps: String(w.reps), notes: w.notes ?? '' });
  }

  function commitEdit(id: number) {
    const w = parseFloat(editForm.weight);
    const r = parseInt(editForm.reps, 10);
    if (!w || !r || w <= 0 || r <= 0) return toast.error('Invalid values');
    updateMut.mutate({ id, payload: { weight: w, reps: r, notes: editForm.notes || null } });
  }

  if (isLoading) return <DetailSkeleton />;

  const { history = [], stats } = data ?? {};
  // Chart data sorted ascending already from API
  const chartData = [...history].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link
          to="/progress"
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{decoded}</h1>
          {stats && (
            <p className="text-gray-500 text-xs mt-0.5">
              {stats.total_sessions} sessions · {format(parseISO(stats.first_date), 'MMM d yyyy')} → {format(parseISO(stats.last_date), 'MMM d yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Best 1RM"
            value={`${stats.best_one_rm.toFixed(1)} lbs`}
            icon={<Trophy size={14} />}
          />
          <StatCard
            label="Latest 1RM"
            value={`${stats.latest_one_rm.toFixed(1)} lbs`}
            icon={<Activity size={14} />}
          />
          <StatCard
            label="Total Sessions"
            value={stats.total_sessions}
            icon={<Calendar size={14} />}
          />
          <StatCard
            label="Improvement"
            value={`+${stats.improvement_lbs.toFixed(1)} lbs`}
            sub={`${stats.improvement_pct >= 0 ? '+' : ''}${stats.improvement_pct.toFixed(1)}%`}
            trend={stats.improvement_pct}
            icon={<TrendingUp size={14} />}
          />
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No data yet for this exercise.</div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="flex items-center justify-between flex-row flex-wrap gap-2">
          <CardTitle>1RM Progress</CardTitle>
          {/* Range filter */}
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.label}
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
        </CardHeader>
        <OneRMChart data={chartData} height={280} />
      </Card>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        {history.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8">No entries in this range</div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2.5 pr-4 text-xs font-medium text-gray-500">Date</th>
                  <th className="pb-2.5 pr-4 text-xs font-medium text-gray-500">Weight</th>
                  <th className="pb-2.5 pr-4 text-xs font-medium text-gray-500">Reps</th>
                  <th className="pb-2.5 pr-4 text-xs font-medium text-gray-500">Est. 1RM</th>
                  <th className="pb-2.5 pr-4 text-xs font-medium text-gray-500">Notes</th>
                  <th className="pb-2.5 text-xs font-medium text-gray-500" />
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map(w => {
                  const isEditing = editId === w.id;
                  const isPR = stats && w.one_rm === stats.best_one_rm;
                  return (
                    <tr key={w.id} className="border-b border-border/50 hover:bg-white/2 group transition-colors">
                      <td className="py-2.5 pr-4 text-gray-400 whitespace-nowrap">
                        {format(parseISO(w.date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-2.5 pr-4 text-white font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.weight}
                            onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))}
                            className="w-20 bg-surface border border-border rounded px-2 py-1 text-sm text-white outline-none focus:border-blue-500/60"
                          />
                        ) : (
                          `${w.weight} lbs`
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-300">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.reps}
                            onChange={e => setEditForm(f => ({ ...f, reps: e.target.value }))}
                            className="w-16 bg-surface border border-border rounded px-2 py-1 text-sm text-white outline-none focus:border-blue-500/60"
                          />
                        ) : (
                          w.reps
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`font-semibold ${isPR ? 'text-yellow-400' : 'text-blue-400'}`}>
                          {w.one_rm.toFixed(1)}
                        </span>
                        {isPR && (
                          <Trophy size={11} className="inline ml-1 text-yellow-400" />
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500 max-w-[140px] truncate">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.notes}
                            onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="notes…"
                            className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-white outline-none focus:border-blue-500/60"
                          />
                        ) : (
                          w.notes ?? '—'
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => commitEdit(w.id)}
                                disabled={updateMut.isPending}
                                className="p-1.5 rounded hover:bg-green-500/10 text-green-400 transition-colors"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => setEditId(null)}
                                className="p-1.5 rounded hover:bg-white/5 text-gray-500 transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(w)}
                                className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this entry?')) deleteMut.mutate(w.id);
                                }}
                                className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-64 bg-card rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl" />)}
      </div>
      <div className="h-80 bg-card rounded-xl" />
      <div className="h-64 bg-card rounded-xl" />
    </div>
  );
}
