import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Dumbbell, Zap, CheckCircle2 } from 'lucide-react';
import { getExercises, createWorkout } from '@/api/client';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// ── 1RM formula ───────────────────────────────────────────────────────────────
const calcOneRM = (weight: number, reps: number) =>
  weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0;

interface FormState {
  exercise: string;
  weight: string;
  reps: string;
  date: string;
  notes: string;
}

const INITIAL: FormState = {
  exercise: '',
  weight: '',
  reps: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
};

export default function LogWorkout() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saved, setSaved] = useState(false);

  const { data: exercises = [] } = useQuery({ queryKey: ['exercises'], queryFn: getExercises });

  const mutation = useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-detail'] });
      toast.success('Workout logged!');
      setSaved(true);
      setForm(f => ({ ...INITIAL, exercise: f.exercise, date: f.date })); // keep exercise + date
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to save');
    },
  });

  const weight = parseFloat(form.weight) || 0;
  const reps   = parseInt(form.reps, 10) || 0;
  const oneRM  = useMemo(() => calcOneRM(weight, reps), [weight, reps]);

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.exercise)          e.exercise = 'Select an exercise';
    if (!form.weight || weight <= 0)  e.weight   = 'Enter a positive weight';
    if (!form.reps   || reps   <= 0)  e.reps     = 'Enter a positive rep count';
    if (!form.date)              e.date     = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      exercise: form.exercise,
      weight,
      reps,
      date: form.date,
      notes: form.notes || null,
    });
  }

  const exerciseOptions = exercises.map(ex => ({ value: ex, label: ex }));

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Log Workout</h1>
        <p className="text-gray-400 text-sm mt-1">
          Record your set — estimated 1RM calculates live
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Exercise */}
          <Select
            label="Exercise"
            value={form.exercise}
            onChange={e => set('exercise', e.target.value)}
            options={exerciseOptions}
            placeholder="Select an exercise…"
            error={errors.exercise}
          />

          {/* Weight & Reps */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weight"
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.5}
              placeholder="135"
              suffix="lbs"
              value={form.weight}
              onChange={e => set('weight', e.target.value)}
              error={errors.weight}
            />
            <Input
              label="Reps"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="5"
              value={form.reps}
              onChange={e => set('reps', e.target.value)}
              error={errors.reps}
            />
          </div>

          {/* Live 1RM preview */}
          {oneRM > 0 && (
            <div className="bg-blue-600/10 border border-blue-600/25 rounded-xl px-4 py-3.5 flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-400 font-medium">Estimated 1RM</p>
                <p className="text-white font-bold text-xl leading-tight">
                  {oneRM.toFixed(1)}
                  <span className="text-gray-400 font-normal text-sm ml-1">lbs</span>
                </p>
              </div>
              <p className="text-xs text-gray-600 ml-auto hidden sm:block">
                weight × (1 + reps/30)
              </p>
            </div>
          )}

          {/* Date */}
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            error={errors.date}
          />

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="RPE 8, paused last rep…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="
                bg-surface border border-border rounded-lg px-3 py-2.5
                text-sm text-white placeholder-gray-600 resize-none outline-none
                focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20
                hover:border-gray-600 transition-colors
              "
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={mutation.isPending}
            className="mt-1"
          >
            {saved ? (
              <>
                <CheckCircle2 size={16} />
                Saved!
              </>
            ) : (
              <>
                <Dumbbell size={16} />
                {mutation.isPending ? 'Saving…' : 'Save Workout'}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Formula note */}
      <p className="text-center text-xs text-gray-600 mt-4">
        Estimated 1RM = weight × (1 + reps ÷ 30) — Epley formula
      </p>
    </div>
  );
}
