"use client"

import { motion } from "framer-motion"
import { Brain, Satellite, Settings } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface WeatherDataSourceToggleProps {
  useAI: boolean
  onToggle: (useAI: boolean) => void
  isRTL: boolean
  className?: string
  disabled?: boolean
}

export function WeatherDataSourceToggle({
  useAI,
  onToggle,
  isRTL,
  className = "",
  disabled = false
}: WeatherDataSourceToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
              <Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-medium text-sm">
              {isRTL ? "مصدر بيانات الطقس" : "Weather Data Source"}
            </h3>
          </div>

          {/* Toggle Section */}
          <div className="space-y-3">
            {/* NASA Option */}
            <motion.div 
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                !useAI 
                  ? "bg-background border-primary/50 shadow-sm" 
                  : "bg-transparent border-border/50"
              }`}
              animate={{
                scale: !useAI ? 1.02 : 1,
                backgroundColor: !useAI ? "hsl(var(--background))" : "transparent"
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  !useAI ? "bg-blue-100 dark:bg-blue-900/50" : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Satellite size={16} className={!useAI ? "text-blue-600" : "text-gray-500"} />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {isRTL ? "بيانات ناسا التاريخية" : "NASA Historical Data"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? "بيانات دقيقة وموثوقة للتواريخ السابقة" : "Accurate, verified data for past dates"}
                  </div>
                </div>
              </div>
              {!useAI && (
                <Badge variant="default" className="text-xs">
                  {isRTL ? "نشط" : "Active"}
                </Badge>
              )}
            </motion.div>

            {/* AI Prediction Option */}
            <motion.div 
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                useAI 
                  ? "bg-background border-primary/50 shadow-sm" 
                  : "bg-transparent border-border/50"
              }`}
              animate={{
                scale: useAI ? 1.02 : 1,
                backgroundColor: useAI ? "hsl(var(--background))" : "transparent"
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  useAI ? "bg-purple-100 dark:bg-purple-900/50" : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Brain size={16} className={useAI ? "text-purple-600" : "text-gray-500"} />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {isRTL ? "توقعات الذكاء الاصطناعي" : "AI Predictions"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? "توقعات ذكية مبنية على بيانات ناسا التاريخية" : "Smart forecasts based on NASA historical patterns"}
                  </div>
                </div>
              </div>
              {useAI && (
                <Badge variant="default" className="text-xs bg-purple-600">
                  {isRTL ? "نشط" : "Active"}
                </Badge>
              )}
            </motion.div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800">
            <div className="text-sm text-muted-foreground">
              {isRTL ? "استخدام التوقعات الذكية للتواريخ المستقبلية" : "Use AI predictions for future dates"}
            </div>
            <Switch
              checked={useAI}
              onCheckedChange={onToggle}
              disabled={disabled}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          {/* Info Text */}
          <motion.div 
            className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p>
              {isRTL 
                ? `${useAI 
                    ? "يستخدم التطبيق حالياً الذكاء الاصطناعي لتوقع الطقس المستقبلي بناءً على البيانات التاريخية من ناسا." 
                    : "يستخدم التطبيق حالياً بيانات ناسا التاريخية الدقيقة فقط."
                  }`
                : `${useAI 
                    ? "App currently uses AI to predict future weather based on NASA historical data patterns."
                    : "App currently uses only verified NASA historical data."
                  }`
              }
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}