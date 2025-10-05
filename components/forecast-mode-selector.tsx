"use client"

import { CalendarClock, CalendarDays } from "lucide-react"
import type { ForecastMode } from "@/lib/forecast-api"

export function ForecastModeSelector({ value, onChange, isRTL }: { value: ForecastMode; onChange: (v: ForecastMode) => void; isRTL: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="forecast-mode" className="text-sm text-muted-foreground">
        {isRTL ? "وضع التنبؤ" : "Forecast Mode"}
      </label>
      <select
        id="forecast-mode"
        className="rounded-md border bg-background px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as ForecastMode)}
      >
        <option value="short_term">{isRTL ? "تنبؤ قصير المدى (٣ أيام القادمة)" : "Short-term (Next 3 Days)"}</option>
        <option value="seasonal">{isRTL ? "تنبؤ موسمي (شهر قادم أو تاريخ محدد)" : "Seasonal (Next Month or Specific Date)"}</option>
      </select>
    </div>
  )
}
