import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dumbbell, Pencil, Check, X, Target, Trash2 } from 'lucide-react';
import { getPersonalBests, getGoals, setGoal, deleteGoal } from '@/api/client';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const EXERCISE_CATEGORIES: Record<string, string[]> = {
  'Push': [
    'Barbell Bench Press',
    'Incline Dumbbell Bench Press',
    'Barbell Shoulder Press',
    'Rope Tricep Extension',
    'Dumbbell Lateral Raise',
    'Dumbbell Skull Crushers',
  ],
  'Pull': [
    'Lat Pulldown',
    'Barbell Rows',
    'Dumbbell Curls',
    'Dumbbell Hammer Curls',
    'Rear Delt Fly',
    'Reverse Wrist Curls',
  ],
  'Legs': [
    'Barbell Squat',
    'Deadlift',
    'Leg Extension',
    'Calf Raises',
  ],
};

export default function Goals() {
  const queryClient = useQueryClient();

  const { data: pbs = [] } = useQuery({
    queryKey: ['personal-bests'],
    queryFn: getPersonalBests,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  const upsertMutation = useMutation({
    mutationFn: ({ exercise, goal_one_rm }: { exercise: string; goal_one_rm: number }) =>
      setGoal(exercise, goal_one_rm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (exercise: string) => deleteGoal(exercise),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const pbMap = new Map(pbs.map(p => [p.exercise, p.one_rm]));
  const goalMap = new Map(goals.map(g => [g.exercise, g.goal_one_rm]));

  // Track which card is being edited and its draft value
  const [editing, setEditing] = useState<Record<string, string>>({});

  function startEdit(exercise: string) {
    const current = goalMap.get(exercise);
    setEditing(prev => ({ ...prev, [exercise]: current !== undefined ? String(current) : '' }));
  }

  function cancelEdit(exercise: string) {
    setEditing(prev => {
      const next = { ...prev };
      delete next[exercise];
      return next;
    });
  }

  function saveEdit(exercise: string) {
    const raw = editing[exercise];
    const value = parseFloat(raw);
    if (isNaN(value) || value <= 0) return;
    upsertMutation.mutate({ exercise, goal_one_rm: value });
    cancelEdit(exercise);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Goals</h1>
        <p className="text-gray-400 text-sm mt-1">
          Set a target 1RM for each lift and track your progress toward it
        </p>
      </div>

      {/* Summary card */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={16} className="text-blue-400" />
              Goal Summary
            </CardTitle>
            <CardDescription>
              {goals.filter(g => {
                const current = pbMap.get(g.exercise) ?? 0;
                return current >= g.goal_one_rm;
              }).length} of {goals.length} goals achieved
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {goals.map(g => {
              const current = pbMap.get(g.exercise) ?? 0;
              const pct = Math.min(100, Math.round((current / g.goal_one_rm) * 100));
              const achieved = pct >= 100;
              return (
                <div key={g.exercise} className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface border border-border">
                  <p className="text-xs text-gray-500 truncate">{g.exercise}</p>
                  <p className={`text-lg font-bold leading-none ${achieved ? 'text-green-400' : 'text-blue-400'}`}>
                    {pct}%
                  </p>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${achieved ? 'bg-green-500' : 'bg-blue-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Per-category exercise cards */}
      {Object.entries(EXERCISE_CATEGORIES).map(([category, exNames]) => (
        <div key={category}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exNames.map(name => {
              const currentOneRM = pbMap.get(name);
              const goalOneRM = goalMap.get(name);
              const isEditing = name in editing;
              const pct = currentOneRM !== undefined && goalOneRM !== undefined
                ? Math.min(100, Math.round((currentOneRM / goalOneRM) * 100))
                : null;
              const achieved = pct !== null && pct >= 100;

              return (
                <div
                  key={name}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
                >
                  {/* Exercise name + edit actions */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-medium text-sm leading-snug">{name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(name)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
                          title={goalOneRM ? 'Edit goal' : 'Set goal'}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {!isEditing && goalOneRM !== undefined && (
                        <button
                          onClick={() => deleteMutation.mutate(name)}
                          className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove goal"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Current 1RM */}
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Current 1RM</p>
                      {currentOneRM !== undefined ? (
                        <p className="text-white font-bold text-base leading-none">
                          {currentOneRM.toFixed(1)}
                          <span className="text-gray-500 font-normal text-xs ml-1">lbs</span>
                        </p>
                      ) : (
                        <p className="text-gray-600 text-sm flex items-center gap-1.5">
                          <Dumbbell size={12} /> No entries yet
                        </p>
                      )}
                    </div>

                    {/* Goal value / edit input */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Goal 1RM</p>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            value={editing[name]}
                            onChange={e => setEditing(prev => ({ ...prev, [name]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(name);
                              if (e.key === 'Escape') cancelEdit(name);
                            }}
                            autoFocus
                            className="w-20 text-right text-sm font-bold bg-surface border border-blue-600/50 rounded-md px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                            placeholder="lbs"
                          />
                          <button
                            onClick={() => saveEdit(name)}
                            className="p-1 rounded-md text-green-400 hover:bg-green-500/10 transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => cancelEdit(name)}
                            className="p-1 rounded-md text-gray-500 hover:bg-white/8 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : goalOneRM !== undefined ? (
                        <p className={`font-bold text-base leading-none ${achieved ? 'text-green-400' : 'text-gray-300'}`}>
                          {goalOneRM.toFixed(1)}
                          <span className="text-gray-500 font-normal text-xs ml-1">lbs</span>
                        </p>
                      ) : (
                        <button
                          onClick={() => startEdit(name)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          + Set goal
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar + percent */}
                  {pct !== null ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${achieved ? 'text-green-400' : 'text-blue-400'}`}>
                          {pct}%{achieved ? ' — Goal reached!' : ' to goal'}
                        </span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${achieved ? 'bg-green-500' : 'bg-blue-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : goalOneRM !== undefined ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">0% to goal — log a set to begin</span>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-blue-600 rounded-full" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-2 bg-border rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
