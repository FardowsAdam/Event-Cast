import type { WeatherData, UserProfile } from "./types"

export function generateHealthAlerts(weather: WeatherData, user: UserProfile | null, isRTL: boolean): string[] {
  if (!user || user.healthProfile.conditions.length === 0) return []

  const alerts: string[] = []
  const { conditions, sensitivities } = user.healthProfile

  // Check temperature sensitivities
  const heatSensitivity = sensitivities.find((s) => s.type === "heat")
  const coldSensitivity = sensitivities.find((s) => s.type === "cold")

  if (heatSensitivity && weather.temperature > 35) {
    const severity =
      heatSensitivity.level === "high" ? "extreme" : heatSensitivity.level === "medium" ? "high" : "moderate"
    alerts.push(
      isRTL
        ? `درجة الحرارة مرتفعة جداً (${weather.temperature}°س). قد تشعر بعدم الراحة بسبب حساسيتك للحرارة.`
        : `Temperature is very high (${weather.temperature}°C). You may experience discomfort due to your heat sensitivity.`,
    )
  }

  if (coldSensitivity && weather.temperature < 10) {
    alerts.push(
      isRTL
        ? `درجة الحرارة منخفضة جداً (${weather.temperature}°س). احرص على ارتداء ملابس دافئة.`
        : `Temperature is very low (${weather.temperature}°C). Make sure to wear warm clothing.`,
    )
  }

  // Check UV sensitivity
  const uvSensitivity = sensitivities.find((s) => s.type === "uv")
  if (uvSensitivity && weather.uvIndex > 7) {
    alerts.push(
      isRTL
        ? `مؤشر الأشعة فوق البنفسجية مرتفع (${weather.uvIndex}). استخدم واقي الشمس وارتدِ قبعة.`
        : `UV index is high (${weather.uvIndex}). Use sunscreen and wear a hat.`,
    )
  }

  // Check humidity sensitivity
  const humiditySensitivity = sensitivities.find((s) => s.type === "humidity")
  if (humiditySensitivity && weather.humidity > 70) {
    alerts.push(
      isRTL
        ? `الرطوبة مرتفعة (${weather.humidity}%). قد يؤثر ذلك على راحتك وتنفسك.`
        : `Humidity is high (${weather.humidity}%). This may affect your comfort and breathing.`,
    )
  }

  // Check wind sensitivity
  const windSensitivity = sensitivities.find((s) => s.type === "wind")
  if (windSensitivity && weather.windSpeed > 30) {
    alerts.push(
      isRTL
        ? `الرياح قوية (${weather.windSpeed} كم/س). قد تزيد من الحساسية والانزعاج.`
        : `Wind is strong (${weather.windSpeed} km/h). May increase sensitivity and discomfort.`,
    )
  }

  // Check precipitation sensitivity
  const precipitationSensitivity = sensitivities.find((s) => s.type === "precipitation")
  if (precipitationSensitivity && weather.precipitation > 50) {
    alerts.push(
      isRTL
        ? `احتمالية هطول أمطار غزيرة (${weather.precipitation}%). قد يؤثر على حالتك الصحية.`
        : `High chance of heavy rain (${weather.precipitation}%). May affect your health condition.`,
    )
  }

  // Condition-specific alerts
  const hasAsthma = conditions.some((c) => c.name === "Asthma")
  const hasAllergies = conditions.some((c) => c.name === "Allergies")
  const hasRespiratory = conditions.some((c) => c.name === "Respiratory Issues")

  if ((hasAsthma || hasRespiratory) && weather.humidity > 80) {
    alerts.push(
      isRTL
        ? "الرطوبة العالية قد تؤثر على التنفس. احمل معك البخاخ الطبي."
        : "High humidity may affect breathing. Keep your inhaler with you.",
    )
  }

  if (hasAllergies && weather.windSpeed > 20) {
    alerts.push(
      isRTL
        ? "الرياح قد تزيد من انتشار حبوب اللقاح. خذ احتياطاتك."
        : "Wind may increase pollen spread. Take precautions.",
    )
  }

  const hasArthritis = conditions.some((c) => c.name === "Arthritis")
  if (hasArthritis && weather.temperature < 15) {
    alerts.push(
      isRTL
        ? "البرودة قد تزيد من آلام المفاصل. حافظ على دفء جسمك."
        : "Cold weather may increase joint pain. Keep yourself warm.",
    )
  }

  return alerts
}
