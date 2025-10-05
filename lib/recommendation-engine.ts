import { getWeatherData, calculateHealthIndex } from "./weather-utils"
import type { BestDayAnalysis, UserProfile, WeatherData, HealthIndexData } from "./types"

interface DayScore {
  date: Date
  score: number
  weather: WeatherData
  healthIndex: HealthIndexData
  reasons: string[]
}

export async function analyzeBestDays(
  location: { lat: number; lon: number },
  eventType: string,
  startDate: Date,
  daysToAnalyze: number,
  user: UserProfile | null,
  isRTL: boolean,
): Promise<BestDayAnalysis[]> {
  const analyses: DayScore[] = []

  // Analyze each day
  for (let i = 0; i < daysToAnalyze; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const weather = await getWeatherData(location.lat, location.lon, date)
    const healthIndex = calculateHealthIndex(weather, eventType)

    const score = calculateDayScore(weather, healthIndex, eventType, user)
    const reasons = generateReasons(weather, healthIndex, eventType, user, isRTL)

    analyses.push({
      date,
      score,
      weather,
      healthIndex,
      reasons,
    })
  }

  // Sort by score (highest first)
  analyses.sort((a, b) => b.score - a.score)

  return analyses
}

function calculateDayScore(
  weather: WeatherData,
  healthIndex: HealthIndexData,
  eventType: string,
  user: UserProfile | null,
): number {
  let score = 50 // Base score

  // Weather condition scoring
  if (weather.condition === "Clear" || weather.condition === "Partly Cloudy") {
    score += 20
  } else if (weather.condition === "Cloudy") {
    score += 10
  } else if (weather.condition === "Rain" || weather.condition === "Snow") {
    score -= 30
  } else if (weather.condition === "Thunderstorm") {
    score -= 40
  }

  // Temperature scoring based on event type
  if (eventType === "outdoor" || eventType === "sports" || eventType === "hiking") {
    if (weather.temperature >= 20 && weather.temperature <= 28) {
      score += 15
    } else if (weather.temperature >= 15 && weather.temperature <= 32) {
      score += 5
    } else if (weather.temperature < 10 || weather.temperature > 38) {
      score -= 20
    }
  } else if (eventType === "wedding" || eventType === "picnic") {
    if (weather.temperature >= 22 && weather.temperature <= 30) {
      score += 15
    } else if (weather.temperature >= 18 && weather.temperature <= 35) {
      score += 5
    } else {
      score -= 15
    }
  }

  // Humidity scoring
  if (weather.humidity < 60) {
    score += 10
  } else if (weather.humidity > 80) {
    score -= 15
  }

  // Wind scoring
  if (weather.windSpeed < 15) {
    score += 10
  } else if (weather.windSpeed > 30) {
    score -= 20
  }

  // UV Index scoring
  if (weather.uvIndex <= 5) {
    score += 5
  } else if (weather.uvIndex > 8) {
    score -= 10
  }

  // Precipitation scoring
  if (weather.precipitation < 20) {
    score += 10
  } else if (weather.precipitation > 60) {
    score -= 25
  }

  // Health index scoring
  if (healthIndex.status === "good") {
    score += 20
  } else if (healthIndex.status === "moderate") {
    score += 5
  } else {
    score -= 15
  }

  // User health profile adjustments
  if (user && user.healthProfile.sensitivities.length > 0) {
    const { sensitivities } = user.healthProfile

    const heatSensitivity = sensitivities.find((s) => s.type === "heat")
    if (heatSensitivity && weather.temperature > 32) {
      const penalty = heatSensitivity.level === "high" ? 20 : heatSensitivity.level === "medium" ? 10 : 5
      score -= penalty
    }

    const coldSensitivity = sensitivities.find((s) => s.type === "cold")
    if (coldSensitivity && weather.temperature < 15) {
      const penalty = coldSensitivity.level === "high" ? 20 : coldSensitivity.level === "medium" ? 10 : 5
      score -= penalty
    }

    const humiditySensitivity = sensitivities.find((s) => s.type === "humidity")
    if (humiditySensitivity && weather.humidity > 70) {
      const penalty = humiditySensitivity.level === "high" ? 15 : humiditySensitivity.level === "medium" ? 8 : 4
      score -= penalty
    }

    const uvSensitivity = sensitivities.find((s) => s.type === "uv")
    if (uvSensitivity && weather.uvIndex > 7) {
      const penalty = uvSensitivity.level === "high" ? 15 : uvSensitivity.level === "medium" ? 8 : 4
      score -= penalty
    }

    const windSensitivity = sensitivities.find((s) => s.type === "wind")
    if (windSensitivity && weather.windSpeed > 25) {
      const penalty = windSensitivity.level === "high" ? 15 : windSensitivity.level === "medium" ? 8 : 4
      score -= penalty
    }
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score))
}

function generateReasons(
  weather: WeatherData,
  healthIndex: HealthIndexData,
  eventType: string,
  user: UserProfile | null,
  isRTL: boolean,
): string[] {
  const reasons: string[] = []

  // Weather condition reasons
  if (weather.condition === "Clear") {
    reasons.push(isRTL ? "سماء صافية مثالية" : "Perfect clear skies")
  } else if (weather.condition === "Partly Cloudy") {
    reasons.push(isRTL ? "طقس معتدل مع غيوم جزئية" : "Pleasant partly cloudy weather")
  } else if (weather.condition === "Rain") {
    reasons.push(isRTL ? "احتمالية هطول أمطار" : "Chance of rain")
  }

  // Temperature reasons
  if (weather.temperature >= 20 && weather.temperature <= 28) {
    reasons.push(isRTL ? "درجة حرارة مثالية" : "Ideal temperature")
  } else if (weather.temperature > 35) {
    reasons.push(isRTL ? "حرارة مرتفعة جداً" : "Very high temperature")
  } else if (weather.temperature < 10) {
    reasons.push(isRTL ? "برودة شديدة" : "Very cold")
  }

  // Humidity reasons
  if (weather.humidity < 50) {
    reasons.push(isRTL ? "رطوبة منخفضة ومريحة" : "Low comfortable humidity")
  } else if (weather.humidity > 80) {
    reasons.push(isRTL ? "رطوبة عالية" : "High humidity")
  }

  // Wind reasons
  if (weather.windSpeed < 10) {
    reasons.push(isRTL ? "رياح هادئة" : "Calm winds")
  } else if (weather.windSpeed > 30) {
    reasons.push(isRTL ? "رياح قوية" : "Strong winds")
  }

  // Health index reasons
  if (healthIndex.status === "good") {
    reasons.push(isRTL ? "مؤشر صحي ممتاز" : "Excellent health index")
  } else if (healthIndex.status === "poor") {
    reasons.push(isRTL ? "مؤشر صحي منخفض" : "Poor health index")
  }

  // Precipitation reasons
  if (weather.precipitation < 10) {
    reasons.push(isRTL ? "احتمالية أمطار منخفضة" : "Low chance of rain")
  } else if (weather.precipitation > 70) {
    reasons.push(isRTL ? "احتمالية أمطار عالية" : "High chance of rain")
  }

  return reasons
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-blue-500"
  if (score >= 40) return "text-yellow-500"
  return "text-red-500"
}

export function getScoreLabel(score: number, isRTL: boolean): string {
  if (score >= 80) return isRTL ? "ممتاز" : "Excellent"
  if (score >= 60) return isRTL ? "جيد" : "Good"
  if (score >= 40) return isRTL ? "متوسط" : "Fair"
  return isRTL ? "ضعيف" : "Poor"
}
