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
import { useState, useEffect, useCallback } from "react"
import { getWeatherData } from "@/lib/weather-utils"
import type { WeatherData } from "@/lib/types"

interface UseWeatherPredictionProps {
  lat: number
  lon: number
  date: Date
  enableAI?: boolean
}

interface WeatherPredictionState {
  weather: WeatherData | null
  isLoading: boolean
  error: string | null
  isAIPrediction: boolean
  confidence?: {
    temperature: number
    humidity: number
    rain: number
    overall: number
  }
}

export function useWeatherPrediction({ 
  lat, 
  lon, 
  date,
  enableAI = true 
}: UseWeatherPredictionProps) {
  const [state, setState] = useState<WeatherPredictionState>({
    weather: null,
    isLoading: true,
    error: null,
    isAIPrediction: false,
  })

  const fetchWeather = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const weatherData = await getWeatherData(lat, lon, date)
      
      setState({
        weather: weatherData,
        isLoading: false,
        error: null,
        isAIPrediction: weatherData.isAiPrediction || false,
        confidence: weatherData.confidence,
      })
    } catch (error) {
      console.error('Error fetching weather:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data',
      }))
    }
  }, [lat, lon, date])

  // Refetch weather when dependencies change
  useEffect(() => {
    if (lat && lon) {
      fetchWeather()
    }
  }, [fetchWeather])

  const retry = useCallback(() => {
    fetchWeather()
  }, [fetchWeather])

  return {
    ...state,
    retry,
    refetch: fetchWeather,
  }
}

// Extended hook for multiple days prediction
export function useWeatherForecast(
  lat: number,
  lon: number, 
  days: number = 7,
  enableAI: boolean = true
) {
  const [forecasts, setForecasts] = useState<WeatherPredictionState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchForecast = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const promises = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i)
        return getWeatherData(lat, lon, date)
      })

      const results = await Promise.all(promises)
      
      const forecastData = results.map(weather => ({
        weather,
        isLoading: false,
        error: null,
        isAIPrediction: weather.isAiPrediction || false,
        confidence: weather.confidence,
      }))

      setForecasts(forecastData)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching forecast:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast')
      setIsLoading(false)
    }
  }, [lat, lon, days])

  useEffect(() => {
    if (lat && lon) {
      fetchForecast()
    }
  }, [fetchForecast])

  return {
    forecasts,
    isLoading,
    error,
    refetch: fetchForecast,
  }
}

// Hook for weather trends and charts
export function useWeatherTrends(
  lat: number,
  lon: number,
  pastDays: number = 7,
  futureDays: number = 3
) {
  const [trends, setTrends] = useState<{
    historical: WeatherData[]
    predicted: WeatherData[]
    isLoading: boolean
    error: string | null
  }>({
    historical: [],
    predicted: [],
    isLoading: true,
    error: null,
  })

  const fetchTrends = useCallback(async () => {
    setTrends(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch historical data
      const historicalPromises = Array.from({ length: pastDays }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (pastDays - i))
        return getWeatherData(lat, lon, date)
      })

      // Fetch future predictions
      const futurePromises = Array.from({ length: futureDays }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        return getWeatherData(lat, lon, date)
      })

      const [historical, predicted] = await Promise.all([
        Promise.all(historicalPromises),
        Promise.all(futurePromises),
      ])

      setTrends({
        historical,
        predicted,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('Error fetching trends:', err)
      setTrends(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch weather trends',
      }))
    }
  }, [lat, lon, pastDays, futureDays])

  useEffect(() => {
    if (lat && lon) {
      fetchTrends()
    }
  }, [fetchTrends])

  return {
    ...trends,
    refetch: fetchTrends,
  }
}
