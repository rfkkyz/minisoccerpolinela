import React from 'react';
import {
  ResponsiveContainer,
  AreaChart as ReAreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const THEME_COLORS = {
  accentStrong: '#12A150',
  segActive: '#3E5C4F',
  accent: '#7CFFB2',
  ink2: '#3F5E50',
  ink3: '#6E8A7C',
  line: '#DCE8E0',
  paper2: '#EAF3EE'
};

const PIE_COLORS = ['#12A150', '#3E5C4F', '#0E2A20', '#7CFFB2', '#E8A317'];

// Custom Tooltip with white panel, radius 12, border --line
export function CustomChartTooltip({ active, payload, label, isCurrency = false }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] p-3 rounded-[12px] border border-[var(--line)] shadow-md text-xs font-mono">
        {label && <p className="font-semibold text-[var(--ink)] mb-1">{label}</p>}
        {payload.map((entry, index) => {
          const val = isCurrency
            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(entry.value)
            : entry.value.toLocaleString('id-ID');

          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-[var(--ink-2)]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span>{entry.name}:</span>
              <span className="font-bold text-[var(--ink)]">{val}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

// 1. Area Chart
export function AreaChart({
  data = [],
  xKey = 'name',
  yKey = 'value',
  height = 240,
  isCurrency = false,
  className = ''
}) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME_COLORS.accentStrong} stopOpacity={0.3} />
              <stop offset="95%" stopColor={THEME_COLORS.accentStrong} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME_COLORS.line} />
          <XAxis
            dataKey={xKey}
            stroke={THEME_COLORS.ink3}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={THEME_COLORS.ink3}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => isCurrency ? `${val / 1000}k` : val}
          />
          <ReTooltip content={<CustomChartTooltip isCurrency={isCurrency} />} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={THEME_COLORS.accentStrong}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#areaGradient)"
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Bar Chart
export function BarChart({
  data = [],
  xKey = 'name',
  yKey = 'value',
  height = 240,
  barColor = THEME_COLORS.accentStrong,
  isCurrency = false,
  className = ''
}) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME_COLORS.line} />
          <XAxis
            dataKey={xKey}
            stroke={THEME_COLORS.ink3}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={THEME_COLORS.ink3}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => isCurrency ? `${val / 1000}k` : val}
          />
          <ReTooltip content={<CustomChartTooltip isCurrency={isCurrency} />} />
          <Bar dataKey={yKey} fill={barColor} radius={[6, 6, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Donut / Pie Chart
export function DonutChart({
  data = [], // [{ name, value }]
  height = 240,
  className = ''
}) {
  return (
    <div className={`w-full flex items-center justify-center ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <ReTooltip content={<CustomChartTooltip />} />
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

