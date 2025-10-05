"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import { EventTypePicker } from "@/components/event-type-picker"
import { WeatherDisplay } from "@/components/weather-display"
import { HealthIndex } from "@/components/health-index"
import { LocationDisplay } from "@/components/location-display"
import { ShareCard } from "@/components/share-card"
import { AuthModal } from "@/components/auth-modal"
import { UserMenu } from "@/components/user-menu"
import { ProfileSettingsModal } from "@/components/profile-settings-modal"
import { HealthProfileModal } from "@/components/health-profile-modal"
import { HealthAlert } from "@/components/health-alert"
import { LocationSearchModal } from "@/components/location-search-modal"
import { BestDaysModal } from "@/components/best-days-modal"
import { MapPickerModal } from "@/components/map-picker-modal"
import { getWeatherData, calculateHealthIndex } from "@/lib/weather-utils"
import { useWeatherPrediction } from "@/hooks/useWeatherPrediction"
import { useForecast } from "@/hooks/useForecast"
import type { ForecastMode } from "@/lib/forecast-api"
import { ForecastModeSelector } from "@/components/forecast-mode-selector"
import { Badge } from "@/components/ui/badge"
import { generateHealthAlerts } from "@/lib/health-alerts"
import { PredictionConfidence } from "@/components/prediction-confidence"
import { SemicircleGauge } from "@/components/semicircle-gauge"
import { getUserProfile, logoutUser } from "@/lib/user-storage"
import type { WeatherData, HealthIndexData, UserProfile } from "@/lib/types"
import { Calendar, MapPin, Sparkles, Search, Lightbulb } from "lucide-react"
import { PredictionChart } from "@/components/prediction-chart"
import { RecommendationCards } from "@/components/recommendation-cards"

export default function Home() {
  // State management for app data
  const [user, setUser] = useState<UserProfile | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showBestDaysModal, setShowBestDaysModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [eventType, setEventType] = useState<string>("")
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string } | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [healthIndex, setHealthIndex] = useState<HealthIndexData | null>(null)
  const [isRTL, setIsRTL] = useState(true) // Default to Arabic RTL
  const [showShareCard, setShowShareCard] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [healthAlerts, setHealthAlerts] = useState<string[]>([])
  const [showMapModal, setShowMapModal] = useState(false)
  const [forecastMode, setForecastMode] = useState<ForecastMode>("short_term")

  useEffect(() => {
    const existingUser = getUserProfile()
    if (existingUser) {
      setUser(existingUser)
      setIsRTL(existingUser.preferences.language === "ar")
    }
  }, [])

  const handleAuth = (profile: UserProfile) => {
    setUser(profile)
    setIsRTL(profile.preferences.language === "ar")
    setShowAuthModal(false)
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setShowAuthModal(true)
  }

  // Get user location using browser geolocation API
  const getUserLocation = () => {
    console.log("[v0] Starting geolocation request...")
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!("geolocation" in navigator)) {
      console.log("[v0] Geolocation not supported")
      const errorMsg = isRTL ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation not supported by browser"
      setLocationError(errorMsg)
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("Geolocation success:", position.coords)
        const { latitude, longitude } = position.coords

        const locationName = await getLocationName(latitude, longitude)

        setLocation({
          lat: latitude,
          lon: longitude,
          name: locationName,
        })

        const weatherData = await getWeatherData(latitude, longitude, selectedDate)
        setWeather(weatherData)

        // Calculate health index based on weather
        const health = calculateHealthIndex(weatherData, eventType)
        setHealthIndex(health)

        setIsLoadingLocation(false)
        setLocationError(null)
      },
      (error) => {
        console.log("[v0] Geolocation error:", error.message, error.code)
        let errorMsg = ""

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = isRTL
              ? "تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع في إعدادات المتصفح"
              : "Location permission denied. Please allow location access in browser settings"
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = isRTL ? "الموقع غير متاح" : "Location unavailable"
            break
          case error.TIMEOUT:
            errorMsg = isRTL ? "انتهت مهلة طلب الموقع" : "Location request timeout"
            break
          default:
            errorMsg = isRTL ? "خطأ في تحديد الموقع" : "Error getting location"
        }

        setLocationError(errorMsg)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const useDefaultLocation = async () => {
    console.log("[v0] Using default location (Riyadh)")
    const defaultLat = 24.7136
    const defaultLon = 46.6753
    setLocation({
      lat: defaultLat,
      lon: defaultLon,
      name: isRTL ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia",
    })

    const weatherData = await getWeatherData(defaultLat, defaultLon, selectedDate)
    setWeather(weatherData)
    const health = calculateHealthIndex(weatherData, eventType)
    setHealthIndex(health)
  }

  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const language = isRTL ? "ar" : "en"
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${language}&addressdetails=1&zoom=10`,
        {
          headers: {
            "User-Agent": "WeatherEventPlanner/1.0",
          },
        },
      )
      const data = await response.json()
      console.log("[v0] Reverse geocoding result:", data)

      if (data.address) {
        // Try to get the most specific location available
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.municipality ||
          data.address.county ||
          data.address.state_district
        const state = data.address.state || data.address.region
        const country = data.address.country

        // Build location string based on available data
        if (city && country) {
          return state && state !== city ? `${city}, ${state}, ${country}` : `${city}, ${country}`
        } else if (state && country) {
          return `${state}, ${country}`
        } else if (country) {
          return country
        }

        // Fallback to display name if we can't build a proper location string
        return data.display_name
      }
    } catch (error) {
      console.log("[v0] Reverse geocoding failed:", error)
    }

    // Fallback to coordinates if reverse geocoding fails
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
  }

  const handleLocationSelect = async (selectedLocation: { lat: number; lon: number; name: string }) => {
    setLocation(selectedLocation)
    const weatherData = await getWeatherData(selectedLocation.lat, selectedLocation.lon, selectedDate)
    setWeather(weatherData)
    const health = calculateHealthIndex(weatherData, eventType)
    setHealthIndex(health)
  }

  useEffect(() => {
    if (weather && user && user.preferences.notificationsEnabled) {
      const alerts = generateHealthAlerts(weather, user, isRTL)
      setHealthAlerts(alerts)
    } else {
      setHealthAlerts([])
    }
  }, [weather, user, isRTL])

  const wp = useWeatherPrediction({ lat: location?.lat, lon: location?.lon, date: selectedDate, useAI: true })
  const unified = useForecast({ lat: location?.lat, lon: location?.lon, date: selectedDate, mode: forecastMode, range: "month" })
  useEffect(() => {
    if (wp.data) {
      setWeather(wp.data)
      setHealthIndex(calculateHealthIndex(wp.data, eventType))
    }
  }, [wp.data, eventType])

  useEffect(() => {
    if (weather && location) {
      const cacheKey = `weather_${location.lat}_${location.lon}_${selectedDate.toISOString().split("T")[0]}`
      localStorage.setItem(cacheKey, JSON.stringify(weather))
    }
  }, [weather, location, selectedDate])

  useEffect(() => {
    const initDefaultLocation = async () => {
      console.log("[v0] Using default location (Riyadh)")
      const defaultLat = 24.7136
      const defaultLon = 46.6753
      setLocation({
        lat: defaultLat,
        lon: defaultLon,
        name: isRTL ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia",
      })

      const weatherData = await getWeatherData(defaultLat, defaultLon, selectedDate)
      setWeather(weatherData)
      const health = calculateHealthIndex(weatherData, eventType)
      setHealthIndex(health)
    }

    initDefaultLocation()
  }, [])

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser)
    setIsRTL(updatedUser.preferences.language === "ar")
    if (updatedUser.preferences.defaultEventType && !eventType) {
      setEventType(updatedUser.preferences.defaultEventType)
    }
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {isRTL ? "مخطط الفعاليات الجوية" : "Weather Event Planner"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsRTL(!isRTL)} className="text-sm">
                {isRTL ? "English" : "العربية"}
              </Button>
              {user ? (
                <UserMenu
                  user={user}
                  isRTL={isRTL}
                  onOpenProfile={() => setShowProfileModal(true)}
                  onOpenHealth={() => setShowHealthModal(true)}
                  onLogout={handleLogout}
                />
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>{isRTL ? "تسجيل الدخول" : "Sign In"}</Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-muted-foreground">
            {isRTL
              ? "خطط فعالياتك بناءً على حالة الطقس ومؤشر الصحة الجوية"
              : "Plan your events based on weather conditions and health index"}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Input Section */}
          <div className="space-y-6">
            {healthAlerts.length > 0 && <HealthAlert alerts={healthAlerts} isRTL={isRTL} />}

            {/* Best Days Recommendation Button */}
            {location && eventType && (
              <Button onClick={() => setShowBestDaysModal(true)} className="w-full" size="lg" variant="default">
                <Lightbulb className="h-5 w-5 mr-2" />
                {isRTL ? "اقتراح أفضل الأيام" : "Suggest Best Days"}
              </Button>
            )}

            {/* Location Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{isRTL ? "الموقع" : "Location"}</h2>
              </div>
              <LocationDisplay location={location} isRTL={isRTL} />
              {locationError && (
                <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{locationError}</div>
              )}
              <div className="flex gap-2 mt-4">
                <Button onClick={getUserLocation} className="flex-1" size="lg" disabled={isLoadingLocation}>
                  {isLoadingLocation
                    ? isRTL
                      ? "جاري تحديد الموقع..."
                      : "Getting location..."
                    : isRTL
                      ? "تحديد موقعي"
                      : "Get My Location"}
                </Button>
                <Button onClick={() => setShowLocationModal(true)} variant="outline" size="lg">
                  <Search className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowMapModal(true)} variant="outline" size="lg">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Date Picker Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{isRTL ? "تاريخ الفعالية" : "Event Date"}</h2>
              </div>
              <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} isRTL={isRTL} />
              <div className="mt-4 flex items-center justify-between">
                <ForecastModeSelector value={forecastMode} onChange={setForecastMode} isRTL={isRTL} />
                <Badge variant="secondary">{isRTL ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI Forecast"}</Badge>
              </div>
            </Card>

            {/* Event Type Picker Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{isRTL ? "نوع الفعالية" : "Event Type"}</h2>
              <EventTypePicker selectedType={eventType} onTypeChange={setEventType} isRTL={isRTL} />
            </Card>
          </div>

          {/* Right Column - Results Section */}
          <div className="space-y-6">
            {/* Weather Display Card */}
            {weather && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">{isRTL ? "حالة الطقس" : "Weather Conditions"}</h2>
                <WeatherDisplay weather={weather} isRTL={isRTL} date={selectedDate} />
                {weather.source === "ai" && (
                  <div className="mt-4">
                    <PredictionConfidence value={weather.predictionConfidence ?? 0.6} isRTL={isRTL} />
                  </div>
                )}
              </Card>
            )}

            {/* Health Index Card */}
            {healthIndex && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">{isRTL ? "مؤشر الصحة الجوية" : "Health Weather Index"}</h2>
                <HealthIndex data={healthIndex} isRTL={isRTL} />
              </Card>
            )}

            {/* Prediction Chart (Unified) */}
            {unified.data && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {forecastMode === "short_term" ? (isRTL ? "التوقعات القصيرة (٣ أيام)" : "Short-term (Next 3 Days)") : (isRTL ? "التوقعات الموسمية" : "Seasonal Forecast")}
                </h2>
                <PredictionChart
                  isRTL={isRTL}
                  data={unified.data.predicted_temperature.map((t, i) => ({ label: `${i + 1}`, temp: t, prec: unified.data?.predicted_precipitation?.[i] ?? 0 }))}
                />
                <div className="mt-6">
                  <SemicircleGauge value={unified.data.confidence} label={isRTL ? "الثقة" : "Confidence"} />
                </div>
                <div className="mt-6">
                  <RecommendationCards
                    isRTL={isRTL}
                    temp={unified.data.predicted_temperature[0] ?? weather?.temperature ?? 0}
                    humidity={unified.data.predicted_humidity[0] ?? weather?.humidity ?? 0}
                    precip={unified.data.predicted_precipitation[0] ?? weather?.precipitation ?? 0}
                  />
                </div>
              </Card>
            )}

            {/* Share Button */}
            {weather && healthIndex && (
              <Button onClick={() => setShowShareCard(true)} className="w-full" size="lg" variant="secondary">
                {isRTL ? "مشاركة البطاقة" : "Share Card"}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Profile Settings Modal */}
      {showProfileModal && user && (
        <ProfileSettingsModal
          user={user}
          isRTL={isRTL}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {showHealthModal && user && (
        <HealthProfileModal
          user={user}
          isRTL={isRTL}
          onClose={() => setShowHealthModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {showLocationModal && (
        <LocationSearchModal
          isRTL={isRTL}
          onClose={() => setShowLocationModal(false)}
          onSelectLocation={handleLocationSelect}
        />
      )}

      {showBestDaysModal && location && eventType && (
        <BestDaysModal
          location={location}
          eventType={eventType}
          startDate={new Date()}
          user={user}
          isRTL={isRTL}
          onClose={() => setShowBestDaysModal(false)}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && <AuthModal isRTL={isRTL} onClose={() => setShowAuthModal(false)} onAuth={handleAuth} />}

      {/* Share Card Modal */}
      {showShareCard && weather && healthIndex && (
        <ShareCard
          weather={weather}
          healthIndex={healthIndex}
          eventType={eventType}
          date={selectedDate}
          location={location}
          isRTL={isRTL}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Map Picker Modal */}
      {showMapModal && (
        <MapPickerModal
          isRTL={isRTL}
          onClose={() => setShowMapModal(false)}
          onSelectLocation={handleLocationSelect}
          initialLocation={location ? { lat: location.lat, lon: location.lon } : undefined}
        />
      )}
    </div>
  )
}
