"use client"

import { Droplets, Wind, Thermometer, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AnimatedWeatherIcon } from "@/components/animated-weather-icon"
import { motion } from "framer-motion"
import type { WeatherData } from "@/lib/types"

interface WeatherDisplayProps {
  weather: WeatherData
  isRTL: boolean
  date: Date
}

export function WeatherDisplay({ weather, isRTL, date }: WeatherDisplayProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedDate = new Date(date)
  selectedDate.setHours(0, 0, 0, 0)
  const isFutureDate = selectedDate > today

  // Map weather conditions to health tips
  const healthTips = [
    {
      condition: weather.temperature >= 30,
      tipAr: "الطقس حار - ارتدِ ملابس خفيفة وفاتحة اللون",
      tipEn: "Hot weather - Wear light, loose-fitting clothes"
    },
    {
      condition: weather.uvIndex >= 8,
      tipAr: "الأشعة فوق البنفسجية عالية جداً - استخدم واقي شمس SPF 50+",
      tipEn: "Very high UV index - Use SPF 50+ sunscreen"
    },
    {
      condition: weather.uvIndex >= 5,
      tipAr: "ارتدِ قبعة ونظارات شمسية",
      tipEn: "Wear a hat and sunglasses"
    },
    {
      condition: weather.windSpeed >= 10 && weather.windSpeed < 25,
      tipAr: "الرياح معتدلة - قد تحتاج لسترة خفيفة",
      tipEn: "Moderate winds - Light jacket recommended"
    },
    {
      condition: weather.temperature < 20 || weather.windSpeed >= 25,
      tipAr: "الطقس غير مثالي للأنشطة الخارجية الطويلة",
      tipEn: "Weather not ideal for extended outdoor activities"
    }
  ].filter(tip => tip.condition) // only show relevant tips

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground pb-2">
        {isFutureDate ? (
          <span>
            {isRTL ? "توقعات الطقس" : "Weather Forecast"}
            {weather.source === "ai" && weather.predictionConfidence != null && (
              <span className="ml-2 text-primary">· {Math.round((weather.predictionConfidence || 0.6) * 100)}%</span>
            )}
          </span>
        ) : (
          <span>{isRTL ? "بيانات تاريخية من NASA" : "Historical Data from NASA"}</span>
        )}
      </div>

      {/* Temperature - Large Display */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center py-6 gap-3">
        <AnimatedWeatherIcon condition={isRTL ? weather.conditionAr : weather.condition} />
        <div className="text-center">
          <div className="text-6xl font-bold text-foreground">
            {weather.temperature}°
          </div>
          <div className="text-xl text-muted-foreground mt-2">
            {isRTL ? weather.conditionAr : weather.condition}
          </div>
          {weather.source === "ai" && (
            <div className="mt-3 flex items-center justify-center">
              <Badge variant="secondary">{isRTL ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI Forecast"}</Badge>
            </div>
          )}
        </div>
      </motion.div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
          <Thermometer className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الحرارة المحسوسة" : "Feels Like"}</div>
            <div className="text-lg font-semibold">{weather.feelsLike}°</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
          <Droplets className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الرطوبة" : "Humidity"}</div>
            <div className="text-lg font-semibold">{weather.humidity}%</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
          <Wind className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الرياح" : "Wind"}</div>
            <div className="text-lg font-semibold">
              {weather.windSpeed} {isRTL ? "كم/س" : "km/h"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
          <Sun className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الأشعة فوق البنفسجية" : "UV Index"}</div>
            <div className="text-lg font-semibold">{weather.uvIndex}</div>
          </div>
        </div>
      </div>

      {/* Health Tips */}
      {healthTips.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-2 pt-4">
          <div className="font-semibold text-foreground">{isRTL ? "نصائح صحية" : "Health Tips"}</div>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {healthTips.map((tip, index) => (
              <li key={index}>{isRTL ? tip.tipAr : tip.tipEn}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}

