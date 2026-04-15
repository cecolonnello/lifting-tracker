import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Workout } from '@/types';

interface ChartPoint {
  date: string;
  one_rm: number;
  weight: number;
  reps: number;
  ma?: number; // 3-session moving average
}

interface OneRMChartProps {
  data: Workout[];
  height?: number;
  showMovingAvg?: boolean;
}

function computeMovingAvg(points: ChartPoint[], window = 3): ChartPoint[] {
  return points.map((p, i) => {
    if (i < window - 1) return p;
    const slice = points.slice(i - window + 1, i + 1);
    const avg = slice.reduce((s, x) => s + x.one_rm, 0) / window;
    return { ...p, ma: parseFloat(avg.toFixed(2)) };
  });
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; payload: ChartPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl text-xs">
      <p className="text-gray-400 mb-2 font-medium">
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-gray-400">Est. 1RM</span>
          <span className="text-white font-bold ml-auto pl-4">{d.one_rm.toFixed(1)} lbs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
          <span className="text-gray-400">Weight</span>
          <span className="text-white font-medium ml-auto pl-4">{d.weight} lbs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
          <span className="text-gray-400">Reps</span>
          <span className="text-white font-medium ml-auto pl-4">{d.reps}</span>
        </div>
      </div>
    </div>
  );
}

// Custom active dot — Recharts injects cx/cy plus other SVG props we don't need
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActiveDot(props: any) {
  const { cx = 0, cy = 0 } = props as { cx?: number; cy?: number };
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#0a0a0a" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={10} fill="#3b82f6" fillOpacity={0.2} />
    </g>
  );
}

export default function OneRMChart({ data, height = 260, showMovingAvg = true }: OneRMChartProps) {
  if (!data.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-gray-600 text-sm"
      >
        No data yet
      </div>
    );
  }

  // Build chart data sorted chronologically
  let points: ChartPoint[] = data
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({ date: w.date, one_rm: w.one_rm, weight: w.weight, reps: w.reps }));

  if (showMovingAvg && points.length >= 3) {
    points = computeMovingAvg(points);
  }

  const best = Math.max(...points.map(p => p.one_rm));
  const yMin = Math.floor((Math.min(...points.map(p => p.one_rm)) * 0.92) / 5) * 5;
  const yMax = Math.ceil((best * 1.04) / 5) * 5;

  const tickFormatter = (v: string) => {
    try { return format(parseISO(v), 'MMM d'); } catch { return v; }
  };

  // Only show a subset of x-axis ticks to avoid crowding
  const tickInterval = Math.max(1, Math.floor(points.length / 7));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1f1f1f"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          interval={tickInterval}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1f1f1f' }}
          tickLine={false}
          dy={6}
        />

        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}`}
          dx={-2}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
        />

        {/* Personal best reference line */}
        <ReferenceLine
          y={best}
          stroke="#3b82f6"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
          label={{
            value: `PR ${best.toFixed(1)}`,
            fill: '#60a5fa',
            fontSize: 10,
            position: 'insideTopRight',
          }}
        />

        {/* Moving average line */}
        {showMovingAvg && points.some(p => p.ma !== undefined) && (
          <Line
            type="monotone"
            dataKey="ma"
            stroke="#1d4ed8"
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            strokeDasharray="6 3"
            strokeOpacity={0.7}
          />
        )}

        {/* Main 1RM line */}
        <Line
          type="monotone"
          dataKey="one_rm"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#3b82f6', stroke: 'none', fillOpacity: 0.7 }}
          activeDot={<ActiveDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
