"use client"
import * as React from "react"
import { Sun, Umbrella, Wind, Activity } from "lucide-react"

export function RecommendationCards({ isRTL, temp, humidity, precip }: { isRTL: boolean; temp: number; humidity: number; precip: number }) {
  const items = [] as Array<{ icon: any; title: string; desc: string }>

  if (precip < 1 && temp >= 20 && temp <= 32 && humidity <= 60) {
    items.push({ icon: Sun, title: isRTL ? "مثالي للفعاليات الخارجية" : "Great for Outdoor Events", desc: isRTL ? "طقس مناسب للنشاطات في الهواء الطلق" : "Comfortable conditions for outdoor plans" })
  }
  if (humidity > 70) {
    items.push({ icon: Wind, title: isRTL ? "رطوبة عالية" : "High Humidity Alert", desc: isRTL ? "قد تشعر بعدم الراحة" : "It may feel muggy outside" })
  }
  if (precip >= 2) {
    items.push({ icon: Umbrella, title: isRTL ? "احتمال هطول أمطار" : "Rain Likely", desc: isRTL ? "احمل مظلة" : "Bring an umbrella" })
  }
  if (items.length === 0) {
    items.push({ icon: Activity, title: isRTL ? "طقس معتدل" : "Moderate Weather", desc: isRTL ? "ظروف عادية" : "Typical conditions" })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((it, i) => (
        <div key={i} className="p-4 rounded-lg bg-secondary/60 backdrop-blur border flex items-start gap-3">
          <it.icon className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium">{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
