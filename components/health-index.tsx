"use client"

import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"
import type { HealthIndexData } from "@/lib/types"

interface HealthIndexProps {
  data: HealthIndexData
  isRTL: boolean
}

export function HealthIndex({ data, isRTL }: HealthIndexProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-500 bg-green-500/10 border-green-500/20"
      case "moderate":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "poor":
        return "text-red-500 bg-red-500/10 border-red-500/20"
      default:
        return "text-muted-foreground bg-secondary border-border"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-12 w-12" />
      case "moderate":
        return <AlertTriangle className="h-12 w-12" />
      case "poor":
        return <AlertCircle className="h-12 w-12" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      <div className={`flex items-center justify-center gap-4 p-6 rounded-lg border-2 ${getStatusColor(data.status)}`}>
        {getStatusIcon(data.status)}
        <div>
          <div className="text-2xl font-bold">{isRTL ? data.statusTextAr : data.statusText}</div>
          <div className="text-sm opacity-80 mt-1">{isRTL ? "مؤشر الصحة الجوية" : "Health Weather Index"}</div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">{isRTL ? "نصائح صحية" : "Health Tips"}</h3>
        <ul className="space-y-2">
          {data.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span className="text-sm leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
        <span className="text-muted-foreground">{isRTL ? "النتيجة الإجمالية" : "Overall Score"}</span>
        <span className="text-2xl font-bold">{data.score}/100</span>
      </div>
    </div>
  )
}
