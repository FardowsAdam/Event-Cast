"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getWeatherData } from "@/lib/weather-utils"
import type { WeatherData } from "@/lib/types"

interface UseWeatherPredictionOptions {
  lat?: number
  lon?: number
  date: Date
  useAI?: boolean // toggle to allow NASA-only
}

export function useWeatherPrediction({ lat, lon, date, useAI = true }: UseWeatherPredictionOptions) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canQuery = typeof lat === "number" && typeof lon === "number"

  const reload = useCallback(async () => {
    if (!canQuery) return
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selected = new Date(date)
      selected.setHours(0, 0, 0, 0)
      const isFuture = selected > today

      if (!useAI && isFuture) {
        // If AI disabled and future requested, just coerce to NASA fallback by asking for yesterday
        const yesterday = new Date(selected)
        yesterday.setDate(selected.getDate() - 1)
        const d = await getWeatherData(lat!, lon!, yesterday)
        setData({ ...d, source: d.source || "nasa" })
      } else {
        const d = await getWeatherData(lat!, lon!, selected)
        setData(d)
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load weather data")
    } finally {
      setLoading(false)
    }
  }, [lat, lon, date, useAI, canQuery])

  useEffect(() => {
    reload()
  }, [reload])

  const meta = useMemo(
    () => ({
      isFuture: (() => {
        const t = new Date(); t.setHours(0,0,0,0)
        const s = new Date(date); s.setHours(0,0,0,0)
        return s > t
      })(),
    }),
    [date]
  )

  return { data, loading, error, reload, ...meta }
}
