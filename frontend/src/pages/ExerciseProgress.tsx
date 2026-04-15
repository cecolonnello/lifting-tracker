import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowRight, Dumbbell } from 'lucide-react';
import { getPersonalBests } from '@/api/client';

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

export default function ExerciseProgress() {
  const { data: pbs = [] } = useQuery({
    queryKey: ['personal-bests'],
    queryFn: getPersonalBests,
  });

  const pbMap = new Map(pbs.map(p => [p.exercise, p]));

  // Get max 1RM for scaling the bar within each category
  const maxOneRM = pbs.length > 0 ? Math.max(...pbs.map(p => p.one_rm)) : 1;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Exercise Progress</h1>
        <p className="text-gray-400 text-sm mt-1">
          Select any exercise to view its full history and 1RM trend
        </p>
      </div>

      {/* Grouped exercise cards */}
      {Object.entries(EXERCISE_CATEGORIES).map(([category, exNames]) => (
        <div key={category}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exNames.map(name => {
              const pb = pbMap.get(name);
              const pct = pb ? (pb.one_rm / maxOneRM) * 100 : 0;

              return (
                <Link
                  key={name}
                  to={`/progress/${encodeURIComponent(name)}`}
                  className="group"
                >
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-blue-600/40 hover:bg-card/80 transition-all">
                    {/* Exercise name */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors leading-snug">
                        {name}
                      </p>
                      <ArrowRight
                        size={14}
                        className="text-gray-600 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5"
                      />
                    </div>

                    {pb ? (
                      <>
                        {/* PR value */}
                        <div className="flex items-end justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Best 1RM</p>
                            <p className="text-white font-bold text-lg leading-none">
                              {pb.one_rm.toFixed(1)}
                              <span className="text-gray-500 font-normal text-xs ml-1">lbs</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">
                              {pb.weight} × {pb.reps}
                            </p>
                            <p className="text-xs text-gray-600">
                              {format(parseISO(pb.date), 'MMM d')}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Dumbbell size={12} />
                        No entries yet
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
