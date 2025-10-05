// Type definitions for the weather event planner app

export interface WeatherData {
  temperature: number
  feelsLike: number
  condition: string
  conditionAr: string
  humidity: number
  windSpeed: number
  uvIndex: number
  precipitation: number
  // Optional fields when using AI predictions
  predictionConfidence?: number
  rainProbability?: number
  source?: "nasa" | "ai" | "mock"
}

export interface HealthIndexData {
  status: "good" | "moderate" | "poor"
  statusText: string
  statusTextAr: string
  score: number
  tips: string[]
}

export interface Location {
  lat: number
  lon: number
  name: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  isGuest: boolean
  createdAt: string
  preferences: UserPreferences
  healthProfile: HealthProfile
  savedLocations: SavedLocation[]
}

export interface UserPreferences {
  language: "ar" | "en"
  defaultEventType: string
  notificationsEnabled: boolean
}

export interface HealthProfile {
  conditions: HealthCondition[]
  sensitivities: WeatherSensitivity[]
}

export interface HealthCondition {
  id: string
  name: string
  nameAr: string
  severity: "mild" | "moderate" | "severe"
}

export interface WeatherSensitivity {
  type: "heat" | "cold" | "humidity" | "uv" | "wind" | "precipitation"
  level: "low" | "medium" | "high"
}

export interface SavedLocation {
  id: string
  lat: number
  lon: number
  name: string
}

export interface BestDayAnalysis {
  date: Date
  score: number
  weather: WeatherData
  healthIndex: HealthIndexData
  reasons: string[]
}
