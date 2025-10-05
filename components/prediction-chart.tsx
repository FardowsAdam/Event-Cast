"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function PredictionChart({ data, isRTL }: { data: Array<{ label: string; temp: number }>; isRTL: boolean }) {
  return (
    <ChartContainer
      config={{ temp: { label: isRTL ? "الحرارة" : "Temperature", color: "hsl(var(--primary))" } }}
      className="aspect-[2/1]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="temp" stroke="var(--color-temp)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
