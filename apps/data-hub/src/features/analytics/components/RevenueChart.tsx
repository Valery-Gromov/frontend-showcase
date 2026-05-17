import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@frontend-showcase/ui';
import type { AnalyticsDashboardResponse } from '../model/types';
import { compactNumber, currency } from '../formatters';

export function RevenueChart({ data }: { data?: AnalyticsDashboardResponse }) {
  if (!data) {
    return <Skeleton variant="rectangle" height="100%" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.series} margin={{ top: 10, right: 22, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--color-outline-variant)" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={{ stroke: 'var(--color-outline)' }}
          tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
          minTickGap={28}
        />
        <YAxis
          tickFormatter={(value) => compactNumber.format(Number(value))}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-outline)' }}
          tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
          width={54}
        />
        <Tooltip formatter={(value) => currency.format(Number(value))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
