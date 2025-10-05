export type ForecastMode = "short_term" | "seasonal"

export interface UnifiedForecastResponse {
  mode: ForecastMode
  predicted_temperature: number[]
  predicted_humidity: number[]
  predicted_precipitation: number[]
  confidence: number
}

const base = () => process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"

export async function fetchShortTerm(lat: number, lon: number, dateISO: string): Promise<UnifiedForecastResponse> {
  const res = await fetch(`${base()}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon, date: dateISO }),
  })
  if (!res.ok) throw new Error(`Short-term forecast failed: ${res.status}`)
  return res.json()
}

export async function fetchSeasonal(lat: number, lon: number, dateISO: string, range: "month" | "date"): Promise<UnifiedForecastResponse> {
  const res = await fetch(`${base()}/predict-seasonal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon, date: dateISO, range }),
  })
  if (!res.ok) throw new Error(`Seasonal forecast failed: ${res.status}`)
  return res.json()
}
