"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function PredictionChart({ data, isRTL, precip }: { data: Array<{ label: string; temp: number }>; isRTL: boolean; precip?: number[] }) {
  return (
    <ChartContainer
      config={{ temp: { label: isRTL ? "الحرارة" : "Temperature", color: "hsl(var(--primary))" } }}
      className="aspect-[2/1]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltipContent />} />
          {precip && (
            <Bar yAxisId="right" dataKey="prec" fill="hsl(var(--muted-foreground))" opacity={0.4} />
          )}
          <Line yAxisId="left" type="monotone" dataKey="temp" stroke="var(--color-temp)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
