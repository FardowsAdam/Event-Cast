"use client"

import { motion } from "framer-motion"
import { Sun, Cloud, CloudRain } from "lucide-react"

export function AnimatedWeatherIcon({ condition, size = 64 }: { condition: string; size?: number }) {
  const normalized = condition.toLowerCase()
  const isRain = normalized.includes("rain")
  const isCloud = normalized.includes("cloud")

  if (isRain) {
    return (
      <div className="relative flex items-center justify-center">
        <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <CloudRain size={size} className="text-blue-500" />
        </motion.div>
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 h-2 w-10 rounded-full bg-blue-400/30"
          animate={{ opacity: [0.6, 0.3, 0.6], scaleX: [1, 0.9, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </div>
    )
  }

  if (isCloud) {
    return (
      <div className="relative flex items-center justify-center">
        <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
          <Cloud size={size} className="text-slate-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center">
      <motion.div animate={{ rotate: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 6 }}>
        <Sun size={size} className="text-yellow-500" />
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-full bg-yellow-400/10 blur-2xl"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
    </div>
  )
}
