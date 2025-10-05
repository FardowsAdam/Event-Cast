"use client"
import * as React from "react"
import { motion } from "framer-motion"

export function SemicircleGauge({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value))
  const radius = 60
  const circumference = Math.PI * radius
  const stroke = 10
  const dash = circumference * pct

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={radius * 2 + stroke} height={radius + stroke} viewBox={`0 0 ${radius * 2 + stroke} ${radius + stroke}`}>
        <g transform={`translate(${stroke / 2}, ${stroke / 2})`}>
          <path
            d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={stroke}
            opacity={0.2}
          />
          <motion.path
            d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </g>
      </svg>
      <div className="-mt-6 text-center">
        <div className="text-2xl font-semibold">{Math.round(pct * 100)}%</div>
        {label && <div className="text-xs text-muted-foreground">{label}</div>}
      </div>
    </div>
  )
}
