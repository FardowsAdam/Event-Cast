"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Calendar, TrendingUp, Sparkles } from "lucide-react"
import { analyzeBestDays, getScoreColor, getScoreLabel } from "@/lib/recommendation-engine"
import type { BestDayAnalysis, UserProfile } from "@/lib/types"

interface BestDaysModalProps {
  location: { lat: number; lon: number; name: string }
  eventType: string
  startDate: Date
  user: UserProfile | null
  isRTL: boolean
  onClose: () => void
  onSelectDate: (date: Date) => void
}

export function BestDaysModal({
  location,
  eventType,
  startDate,
  user,
  isRTL,
  onClose,
  onSelectDate,
}: BestDaysModalProps) {
  const [analyses, setAnalyses] = useState<BestDayAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [daysToShow, setDaysToShow] = useState(7)

  useEffect(() => {
    const loadAnalyses = async () => {
      setIsLoading(true)
      const results = await analyzeBestDays(location, eventType, startDate, daysToShow, user, isRTL)
      setAnalyses(results)
      setIsLoading(false)
    }

    loadAnalyses()
  }, [location, eventType, startDate, daysToShow, user, isRTL])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", options)
  }

  const handleSelectDay = (date: Date) => {
    onSelectDate(date)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {isRTL ? "أفضل الأيام لفعاليتك" : "Best Days for Your Event"}
          </h2>
          <p className="text-muted-foreground">
            {isRTL
              ? `تحليل ${daysToShow} أيام القادمة بناءً على الطقس وملفك الصحي`
              : `Analyzing the next ${daysToShow} days based on weather and your health profile`}
          </p>
        </div>

        {/* Days selector */}
        <div className="flex gap-2 mb-6">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              variant={daysToShow === days ? "default" : "outline"}
              size="sm"
              onClick={() => setDaysToShow(days)}
            >
              {days} {isRTL ? "يوم" : "days"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">{isRTL ? "جاري التحليل..." : "Analyzing..."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis, index) => (
              <Card
                key={index}
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  index === 0 ? "border-2 border-primary" : ""
                }`}
                onClick={() => handleSelectDay(analysis.date)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{formatDate(analysis.date)}</p>
                        {index === 0 && (
                          <p className="text-xs text-primary font-medium">{isRTL ? "الخيار الأفضل" : "Best Choice"}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? "الطقس" : "Weather"}</p>
                        <p className="text-sm font-medium">
                          {isRTL ? analysis.weather.conditionAr : analysis.weather.condition}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? "الحرارة" : "Temp"}</p>
                        <p className="text-sm font-medium">{analysis.weather.temperature}°C</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? "الرطوبة" : "Humidity"}</p>
                        <p className="text-sm font-medium">{analysis.weather.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? "الأمطار" : "Rain"}</p>
                        <p className="text-sm font-medium">{analysis.weather.precipitation}%</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {analysis.reasons.map((reason, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-muted rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}</div>
                    <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(analysis.score, isRTL)}</p>
                    <div className="mt-2">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                          analysis.healthIndex.status === "good"
                            ? "bg-green-500/20 text-green-500"
                            : analysis.healthIndex.status === "moderate"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? "النتائج مبنية على تحليل شامل للطقس، نوع الفعالية، وملفك الصحي. انقر على أي يوم لاختياره."
              : "Results are based on comprehensive analysis of weather, event type, and your health profile. Click any day to select it."}
          </p>
        </div>
      </Card>
    </div>
  )
}
