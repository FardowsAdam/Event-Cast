"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Share2 } from "lucide-react"
import type { WeatherData, HealthIndexData } from "@/lib/types"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface ShareCardProps {
  weather: WeatherData
  healthIndex: HealthIndexData
  eventType: string
  date: Date
  location: { lat: number; lon: number; name: string } | null
  isRTL: boolean
  onClose: () => void
}

export function ShareCard({ weather, healthIndex, eventType, date, location, isRTL, onClose }: ShareCardProps) {
  const handleShare = async () => {
    const text = isRTL
      ? `مؤشر الصحة الجوية: ${healthIndex.statusTextAr}\nالطقس: ${weather.temperature}° - ${weather.conditionAr}\nالتاريخ: ${format(date, "PPP", { locale: ar })}`
      : `Health Index: ${healthIndex.statusText}\nWeather: ${weather.temperature}° - ${weather.condition}\nDate: ${format(date, "PPP")}`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      navigator.clipboard.writeText(text)
      alert(isRTL ? "تم النسخ إلى الحافظة" : "Copied to clipboard")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "moderate":
        return "bg-yellow-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full p-6 relative">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>

        <div className="space-y-6 mt-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{isRTL ? "بطاقة الفعالية" : "Event Card"}</h2>
            <p className="text-muted-foreground">{format(date, "PPP", { locale: isRTL ? ar : undefined })}</p>
          </div>

          {location && <div className="text-center text-sm text-muted-foreground">{location.name}</div>}

          <div className="flex items-center justify-center gap-4 p-6 bg-secondary rounded-lg">
            <div className="text-center">
              <div className="text-5xl font-bold">{weather.temperature}°</div>
              <div className="text-muted-foreground mt-1">{isRTL ? weather.conditionAr : weather.condition}</div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${getStatusColor(healthIndex.status)}/10 border-2 ${getStatusColor(healthIndex.status)}/20`}
          >
            <div className="text-center">
              <div className={`text-xl font-bold ${getStatusColor(healthIndex.status).replace("bg-", "text-")}`}>
                {isRTL ? healthIndex.statusTextAr : healthIndex.statusText}
              </div>
              <div className="text-sm mt-1 opacity-80">{isRTL ? "مؤشر الصحة الجوية" : "Health Weather Index"}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleShare} className="flex-1" size="lg">
              <Share2 className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "مشاركة" : "Share"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
