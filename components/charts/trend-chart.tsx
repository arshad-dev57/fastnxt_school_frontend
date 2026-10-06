"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, tooltipStyles, useChartMotion, useChartTheme } from "./chart-theme";
import { ChartBox, ChartEmpty } from "./chart-kit";

/* ============================================================================
   Generic single-series trend chart — used by module dashboards (e.g. the
   Accounts dashboard). Colours come from the shared chart tokens, so it
   follows every theme automatically.
   ========================================================================== */
export function TrendChart({ data, height = 230, areaId = "trendFill", valueFormatter }: {
  data: { label: string; value: number }[];
  height?: number;
  areaId?: string;
  valueFormatter?: (n: number) => string;
}) {
  const p = useChartTheme();
  const { animate, duration } = useChartMotion();
  const fmt = (n: number) => (valueFormatter ? valueFormatter(n) : n.toLocaleString("en-PK"));

  if (data.length === 0) return <ChartEmpty height={height} />;

  return (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.primary} stopOpacity={0.4} />
              <stop offset="100%" stopColor={p.primary} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK(p)} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK(p)} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => fmt(Number(v))} />
          <Tooltip {...tooltipStyles(p)} cursor={{ stroke: p.axis, strokeDasharray: "4 4" }} formatter={(v) => fmt(Number(v))} />
          <Area type="monotone" dataKey="value" name="Amount" stroke={p.primary} strokeWidth={2.4}
            fill={`url(#${areaId})`} isAnimationActive={animate} animationDuration={duration} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}
