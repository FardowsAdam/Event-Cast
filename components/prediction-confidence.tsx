"use client"

import { Progress } from "@/components/ui/progress"

export function PredictionConfidence({ value, isRTL }: { value: number; isRTL: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">
        {isRTL ? "مستوى الثقة في التوقع" : "Prediction Confidence"}
      </div>
      <Progress value={pct} />
      <div className="mt-1 text-xs text-muted-foreground">{pct}%</div>
    </div>
  )
}
