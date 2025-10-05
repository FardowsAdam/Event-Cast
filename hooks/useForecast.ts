"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ForecastMode, UnifiedForecastResponse } from "@/lib/forecast-api"
import { fetchShortTerm, fetchSeasonal } from "@/lib/forecast-api"

export function useForecast({ lat, lon, date, mode, range = "month" as "month" | "date" }: { lat?: number; lon?: number; date: Date; mode: ForecastMode; range?: "month" | "date" }) {
  const [data, setData] = useState<UnifiedForecastResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const can = typeof lat === "number" && typeof lon === "number"
  const dateISO = useMemo(() => date.toISOString().split("T")[0], [date])

  const load = useCallback(async () => {
    if (!can) return
    setLoading(true)
    setError(null)
    try {
      const res = mode === "short_term"
        ? await fetchShortTerm(lat!, lon!, dateISO)
        : await fetchSeasonal(lat!, lon!, dateISO, range)
      setData(res)
    } catch (e: any) {
      setError(e?.message || "Failed to load forecast")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [can, lat, lon, dateISO, mode, range])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load }
}
