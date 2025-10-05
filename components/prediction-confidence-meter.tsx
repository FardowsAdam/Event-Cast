"use client"

import { motion } from "framer-motion"
import { TrendingUp, Brain, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { WeatherData } from "@/lib/types"

interface PredictionConfidenceMeterProps {
  weather: WeatherData
  isRTL: boolean
  className?: string
}

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return "text-green-500"
  if (confidence >= 0.6) return "text-yellow-500"  
  return "text-red-500"
}

const getConfidenceColorBg = (confidence: number): string => {
  if (confidence >= 0.8) return "bg-green-500"
  if (confidence >= 0.6) return "bg-yellow-500"
  return "bg-red-500"
}

const getConfidenceLabel = (confidence: number, isRTL: boolean): string => {
  if (confidence >= 0.8) {
    return isRTL ? "ثقة عالية" : "High Confidence"
  }
  if (confidence >= 0.6) {
    return isRTL ? "ثقة متوسطة" : "Medium Confidence"  
  }
  return isRTL ? "ثقة منخفضة" : "Low Confidence"
}

export function PredictionConfidenceMeter({ 
  weather, 
  isRTL, 
  className = "" 
}: PredictionConfidenceMeterProps) {
  if (!weather.isAiPrediction || !weather.confidence) {
    return null
  }

  const { confidence } = weather
  const overallConfidence = confidence.overall

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <Brain size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {isRTL ? "مؤشر ثقة التوقع الذكي" : "AI Prediction Confidence"}
              </h3>
              <Badge 
                variant="outline" 
                className={`text-xs ${getConfidenceColor(overallConfidence)} border-current`}
              >
                <Activity size={10} className="mr-1" />
                {getConfidenceLabel(overallConfidence, isRTL)}
              </Badge>
            </div>
          </div>

          {/* Overall confidence display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isRTL ? "الثقة الإجمالية" : "Overall Confidence"}
              </span>
              <span className={`text-sm font-bold ${getConfidenceColor(overallConfidence)}`}>
                {Math.round(overallConfidence * 100)}%
              </span>
            </div>
            
            <div className="relative">
              <Progress value={overallConfidence * 100} className="h-2" />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallConfidence * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute top-0 left-0 h-2 rounded-full ${getConfidenceColorBg(overallConfidence)}`}
              />
            </div>
          </div>

          {/* Detailed confidence breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-purple-200 dark:border-purple-800">
            <motion.div 
              className="text-center"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {isRTL ? "الحرارة" : "Temp"}
              </div>
              <div className={`text-sm font-medium ${getConfidenceColor(confidence.temperature)}`}>
                {Math.round(confidence.temperature * 100)}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence.temperature * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-1 rounded-full ${getConfidenceColorBg(confidence.temperature)}`}
                />
              </div>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {isRTL ? "الرطوبة" : "Humidity"}
              </div>
              <div className={`text-sm font-medium ${getConfidenceColor(confidence.humidity)}`}>
                {Math.round(confidence.humidity * 100)}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence.humidity * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className={`h-1 rounded-full ${getConfidenceColorBg(confidence.humidity)}`}
                />
              </div>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {isRTL ? "المطر" : "Rain"}
              </div>
              <div className={`text-sm font-medium ${getConfidenceColor(confidence.rain)}`}>
                {Math.round(confidence.rain * 100)}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence.rain * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className={`h-1 rounded-full ${getConfidenceColorBg(confidence.rain)}`}
                />
              </div>
            </motion.div>
          </div>

          {/* AI insight text */}
          <motion.div 
            className="text-xs text-muted-foreground pt-2 border-t border-purple-200 dark:border-purple-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={10} />
              <span className="font-medium">
                {isRTL ? "معلومات ذكية:" : "AI Insight:"}
              </span>
            </div>
            <p>
              {isRTL 
                ? `هذا التوقع مبني على تحليل بيانات ناسا التاريخية باستخدام خوارزميات التعلم الآلي.`
                : `This prediction is based on NASA historical data analysis using machine learning algorithms.`
              }
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}