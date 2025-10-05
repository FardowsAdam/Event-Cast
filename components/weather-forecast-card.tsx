"use client"

import { motion } from "framer-motion"
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Zap
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { WeatherData } from "@/lib/types"

interface WeatherForecastCardProps {
  weather: WeatherData
  isRTL: boolean
  className?: string
  showConfidence?: boolean
  date?: Date
}

const getWeatherIcon = (condition: string, size: number = 24) => {
  const iconProps = { size, className: "text-white drop-shadow-sm" }
  
  switch (condition.toLowerCase()) {
    case "clear":
    case "sunny":
      return <Sun {...iconProps} className="text-yellow-400 drop-shadow-sm" />
    case "partly cloudy":
      return <Cloud {...iconProps} className="text-gray-300 drop-shadow-sm" />
    case "cloudy":
      return <Cloud {...iconProps} className="text-gray-400 drop-shadow-sm" />
    case "rainy":
    case "rain":
      return <CloudRain {...iconProps} className="text-blue-400 drop-shadow-sm" />
    case "snow":
      return <CloudSnow {...iconProps} className="text-blue-200 drop-shadow-sm" />
    default:
      return <Sun {...iconProps} className="text-yellow-400 drop-shadow-sm" />
  }
}

const getGradientBackground = (condition: string, temperature: number) => {
  if (condition.toLowerCase().includes("rain")) {
    return "bg-gradient-to-br from-blue-500 to-blue-700"
  }
  
  if (condition.toLowerCase().includes("cloud")) {
    return "bg-gradient-to-br from-gray-400 to-gray-600"
  }
  
  if (temperature > 35) {
    return "bg-gradient-to-br from-red-500 to-orange-600"
  } else if (temperature > 25) {
    return "bg-gradient-to-br from-orange-400 to-yellow-500"
  } else if (temperature > 15) {
    return "bg-gradient-to-br from-green-400 to-blue-500"
  } else {
    return "bg-gradient-to-br from-blue-400 to-purple-600"
  }
}

export function WeatherForecastCard({ 
  weather, 
  isRTL, 
  className = "",
  showConfidence = true,
  date
}: WeatherForecastCardProps) {
  const gradientBg = getGradientBackground(weather.condition, weather.temperature)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className={`relative overflow-hidden border-0 ${gradientBg} text-white`}>
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        
        <div className="relative p-6">
          {/* Header with AI Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {date && (
                <span className="text-sm opacity-80">
                  {isRTL 
                    ? date.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' })
                    : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                  }
                </span>
              )}
            </div>
            
            {weather.isAiPrediction && (
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                <Zap size={12} className="mr-1" />
                {isRTL ? "توقع ذكي" : "AI Forecast"}
              </Badge>
            )}
          </div>

          {/* Main temperature display */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.div 
                className="text-4xl font-bold mb-1"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {weather.temperature}°
              </motion.div>
              <div className="text-sm opacity-80 capitalize">
                {isRTL ? weather.conditionAr : weather.condition}
              </div>
            </div>
            
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {getWeatherIcon(weather.condition, 48)}
            </motion.div>
          </div>

          {/* Weather details grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Thermometer size={16} className="opacity-80" />
              <div className="text-sm">
                <div className="opacity-80">{isRTL ? "الإحساس" : "Feels"}</div>
                <div className="font-medium">{weather.feelsLike}°</div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Droplets size={16} className="opacity-80" />
              <div className="text-sm">
                <div className="opacity-80">{isRTL ? "الرطوبة" : "Humidity"}</div>
                <div className="font-medium">{weather.humidity}%</div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Wind size={16} className="opacity-80" />
              <div className="text-sm">
                <div className="opacity-80">{isRTL ? "الرياح" : "Wind"}</div>
                <div className="font-medium">{weather.windSpeed} {isRTL ? "كم/س" : "km/h"}</div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Eye size={16} className="opacity-80" />
              <div className="text-sm">
                <div className="opacity-80">{isRTL ? "الأشعة فوق البنفسجية" : "UV Index"}</div>
                <div className="font-medium">{weather.uvIndex}</div>
              </div>
            </motion.div>
          </div>

          {/* Confidence meter for AI predictions */}
          {showConfidence && weather.isAiPrediction && weather.confidence && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4 border-t border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-80">
                  {isRTL ? "مستوى الثقة" : "Prediction Confidence"}
                </span>
                <span className="text-xs font-medium">
                  {Math.round(weather.confidence.overall * 100)}%
                </span>
              </div>
              <Progress 
                value={weather.confidence.overall * 100} 
                className="h-1 bg-white/20"
              />
            </motion.div>
          )}
        </div>

        {/* Animated background elements */}
        <motion.div 
          className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </Card>
    </motion.div>
  )
}