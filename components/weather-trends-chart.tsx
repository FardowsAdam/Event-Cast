"use client"

import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Thermometer } from "lucide-react"
import { useWeatherTrends } from "@/hooks/useWeatherPrediction"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeatherData } from "@/lib/types"

interface WeatherTrendsChartProps {
  lat: number
  lon: number
  isRTL: boolean
  className?: string
}

interface ChartDataPoint {
  date: string
  temperature: number
  humidity: number
  isPredicted: boolean
  confidence?: number
}

const formatDate = (date: Date, isRTL: boolean): string => {
  return isRTL 
    ? date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label, isRTL }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Thermometer size={12} className="text-orange-500" />
            <span>{payload[0].value}° {isRTL ? "درجة مئوية" : "°C"}</span>
            {data.isPredicted && (
              <Badge variant="outline" className="text-xs">
                {isRTL ? "توقع" : "Predicted"}
              </Badge>
            )}
          </div>
          {data.confidence && (
            <div className="text-xs text-muted-foreground">
              {isRTL ? "الثقة: " : "Confidence: "}{Math.round(data.confidence * 100)}%
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function WeatherTrendsChart({ 
  lat, 
  lon, 
  isRTL, 
  className = "" 
}: WeatherTrendsChartProps) {
  const { historical, predicted, isLoading, error, refetch } = useWeatherTrends(lat, lon, 7, 3)

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            {isRTL ? "خطأ في تحميل البيانات" : "Error loading trends"}
          </p>
          <button 
            onClick={refetch}
            className="text-sm text-primary hover:underline"
          >
            {isRTL ? "إعادة المحاولة" : "Try Again"}
          </button>
        </div>
      </Card>
    )
  }

  // Prepare chart data
  const chartData: ChartDataPoint[] = [
    ...historical.map((weather, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (7 - index))
      return {
        date: formatDate(date, isRTL),
        temperature: weather.temperature,
        humidity: weather.humidity,
        isPredicted: false,
      }
    }),
    ...predicted.map((weather, index) => {
      const date = new Date()
      date.setDate(date.getDate() + index + 1)
      return {
        date: formatDate(date, isRTL),
        temperature: weather.temperature,
        humidity: weather.humidity,
        isPredicted: true,
        confidence: weather.confidence?.overall,
      }
    })
  ]

  const maxTemp = Math.max(...chartData.map(d => d.temperature)) + 5
  const minTemp = Math.min(...chartData.map(d => d.temperature)) - 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">
                {isRTL ? "اتجاهات درجة الحرارة" : "Temperature Trends"}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Calendar size={10} className="mr-1" />
                {isRTL ? "7 أيام + 3 توقع" : "7 days + 3 forecast"}
              </Badge>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span>{isRTL ? "بيانات تاريخية" : "Historical"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500 border-dashed border-t-2 border-orange-500" />
              <span>{isRTL ? "توقع ذكي" : "AI Prediction"}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[minTemp, maxTemp]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip isRTL={isRTL} />} />
                
                {/* Historical data area */}
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#temperatureGradient)"
                  connectNulls={false}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction line overlay */}
          <div className="h-64 -mt-64 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.slice(-4)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#F97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <motion.div 
            className="flex items-center justify-between pt-4 border-t text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-muted-foreground">
              {isRTL ? "متوسط الأسبوع: " : "Week Average: "}
              <span className="font-medium text-foreground">
                {Math.round(historical.reduce((sum, w) => sum + w.temperature, 0) / historical.length)}°
              </span>
            </div>
            <div className="text-muted-foreground">
              {isRTL ? "توقع الغد: " : "Tomorrow: "}
              <span className="font-medium text-foreground">
                {predicted[0]?.temperature}°
                {predicted[0]?.isAiPrediction && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {isRTL ? "ذكي" : "AI"}
                  </Badge>
                )}
              </span>
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}