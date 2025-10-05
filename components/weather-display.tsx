"use client"

import { Droplets, Wind, Thermometer, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AnimatedWeatherIcon } from "@/components/animated-weather-icon"
import { motion } from "framer-motion"
import { motion } from "framer-motion"
import { Droplets, Wind, Thermometer, Sun, Brain, Satellite } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center text-sm text-muted-foreground pb-2 flex items-center justify-center gap-2">
        {weather.isAiPrediction ? (
          <>
            <Brain size={16} className="text-purple-600" />
            <span className="flex items-center gap-1">
              {isRTL ? "توقع ذكي بناءً على بيانات NASA" : "AI Prediction based on NASA data"}
              <Badge variant="secondary" className="text-xs">
                {isRTL ? "ذكي" : "AI"}
              </Badge>
            </span>
          </>
        ) : isFutureDate ? (
          <>
            <Sun size={16} className="text-orange-500" />
            <span>{isRTL ? "توقعات الطقس" : "Weather Forecast"}</span>
          </>
        ) : (
          <>
            <Satellite size={16} className="text-blue-600" />
            <span>{isRTL ? "بيانات تاريخية من NASA" : "Historical Data from NASA"}</span>
          </>
        )}
      </div>

      {/* AI Confidence Badge */}
      {weather.isAiPrediction && weather.confidence && (
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Badge 
            variant="outline" 
            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
          >
            {isRTL ? "مستوى الثقة: " : "Confidence: "}{Math.round(weather.confidence.overall * 100)}%
          </Badge>
        </motion.div>
      )}

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
          <motion.div 
            className="text-6xl font-bold text-foreground"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {weather.temperature}°
          </motion.div>
          <motion.div 
            className="text-xl text-muted-foreground mt-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isRTL ? weather.conditionAr : weather.condition}
          </motion.div>
        </div>
      </motion.div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          className="flex items-center gap-3 p-4 bg-secondary rounded-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <Thermometer className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الحرارة المحسوسة" : "Feels Like"}</div>
            <div className="text-lg font-semibold">{weather.feelsLike}°</div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3 p-4 bg-secondary rounded-lg"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Droplets className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الرطوبة" : "Humidity"}</div>
            <div className="text-lg font-semibold">{weather.humidity}%</div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3 p-4 bg-secondary rounded-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
        >
          <Wind className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الرياح" : "Wind"}</div>
            <div className="text-lg font-semibold">
              {weather.windSpeed} {isRTL ? "كم/س" : "km/h"}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3 p-4 bg-secondary rounded-lg"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
        >
          <Sun className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-muted-foreground">{isRTL ? "الأشعة فوق البنفسجية" : "UV Index"}</div>
            <div className="text-lg font-semibold">{weather.uvIndex}</div>
          </div>
        </motion.div>
      </div>

      {/* Health Tips */}
      {healthTips.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-2 pt-4">
        <motion.div 
          className="space-y-2 pt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="font-semibold text-foreground">{isRTL ? "نصائح صحية" : "Health Tips"}</div>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {healthTips.map((tip, index) => (
              <motion.li 
                key={index}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                {isRTL ? tip.tipAr : tip.tipEn}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* AI Powered Banner */}
      {weather.isAiPrediction && (
        <motion.div 
          className="flex items-center justify-center pt-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-800">
            <Brain size={12} className="inline mr-1" />
            {isRTL ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI Forecast"}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

