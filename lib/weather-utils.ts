import type { WeatherData, HealthIndexData } from "./types"

// AI Prediction Configuration
const AI_API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"

interface AIPredictionResponse {
  temperature: number
  humidity: number
  rain_probability: number
  confidence: {
    temperature: number
    humidity: number
    rain: number
    overall: number
  }
  condition: string
  condition_ar: string
  feels_like: number
  wind_speed: number
  uv_index: number
  precipitation: number
  is_ai_prediction: boolean
}

async function getAIPrediction(lat: number, lon: number, date: Date): Promise<WeatherData | null> {
  try {
    // First, get current weather data to feed to the AI model
    const currentWeatherData = await getCurrentWeatherForAI(lat, lon)
    if (!currentWeatherData) {
      throw new Error('Could not get current weather data for AI prediction')
    }

    // Make request to AI prediction API
    const response = await fetch(`${AI_API_BASE_URL}/predict-weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat,
        lon,
        current_weather: currentWeatherData,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API responded with status: ${response.status}`)
    }

    const prediction: AIPredictionResponse = await response.json()

    return {
      temperature: Math.round(prediction.temperature),
      feelsLike: Math.round(prediction.feels_like),
      condition: prediction.condition,
      conditionAr: prediction.condition_ar,
      humidity: Math.round(prediction.humidity),
      windSpeed: Math.round(prediction.wind_speed),
      uvIndex: Math.round(prediction.uv_index),
      precipitation: Math.round(prediction.precipitation),
      isAiPrediction: true,
      confidence: prediction.confidence,
    }
  } catch (error) {
    console.error('AI prediction error:', error)
    return null
  }
}

async function getCurrentWeatherForAI(lat: number, lon: number): Promise<any> {
  try {
    // Try to get recent NASA data first
    const today = new Date()
    const nasaData = await fetchNASAWeatherData(lat, lon, today)
    if (nasaData) {
      return {
        temperature: nasaData.temperature,
        humidity: nasaData.humidity,
        precipitation: nasaData.precipitation,
        wind_speed: nasaData.windSpeed / 3.6, // Convert km/h back to m/s
        uv_index: nasaData.uvIndex,
      }
    }

    // Fallback to mock current weather
    const mockData = generateMockWeatherData(lat, lon, today)
    return {
      temperature: mockData.temperature,
      humidity: mockData.humidity,
      precipitation: mockData.precipitation,
      wind_speed: mockData.windSpeed / 3.6,
      uv_index: mockData.uvIndex,
    }
  } catch (error) {
    console.error('Error getting current weather for AI:', error)
    return null
  }
}

export async function getWeatherData(lat: number, lon: number, date: Date): Promise<WeatherData> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedDate = new Date(date)
  selectedDate.setHours(0, 0, 0, 0)
  const isFutureDate = selectedDate > today

  // For future dates, use AI prediction API instead of mock
  if (isFutureDate) {
    const ai = await fetchAIPrediction(lat, lon, selectedDate)
    if (ai) return ai
    // fallback to mock if AI unavailable
    return generateMockWeatherData(lat, lon, date)
  // For future dates, use AI prediction if available, otherwise fallback to mock
  if (isFutureDate) {
    try {
      const aiPrediction = await getAIPrediction(lat, lon, date)
      if (aiPrediction) {
        return aiPrediction
      }
    } catch (error) {
      console.warn('AI prediction failed, using fallback:', error)
    }
    // Fallback to mock forecast if AI fails
    return generateForecastData(lat, lon, date)
  }

  // For past/today dates, try NASA POWER API for historical data
  try {
    const weatherData = await fetchNASAWeatherData(lat, lon, date)
    if (weatherData) {
      return weatherData
    }
  } catch (error) {
    // Silently fall back to mock data
  }

  // Fallback to mock data if NASA API fails
  return generateMockWeatherData(lat, lon, date)
}

async function fetchNASAWeatherData(lat: number, lon: number, date: Date): Promise<WeatherData | null> {
  try {
    // Format date for NASA API (YYYYMMDD)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}${month}${day}`

    // NASA POWER API endpoint for daily weather data
    const params = "T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR,ALLSKY_SFC_UV_INDEX"
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&start=${dateStr}&end=${dateStr}&format=JSON`

    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Extract weather data from NASA response
    const properties = data.properties?.parameter
    if (!properties) {
      return null
    }

    // Get the data for the specific date
    const temp = properties.T2M?.[dateStr]
    const tempMax = properties.T2M_MAX?.[dateStr]
    const tempMin = properties.T2M_MIN?.[dateStr]
    const humidity = properties.RH2M?.[dateStr]
    const windSpeed = properties.WS2M?.[dateStr]
    const precipitation = properties.PRECTOTCORR?.[dateStr]
    const uvIndex = properties.ALLSKY_SFC_UV_INDEX?.[dateStr]

    // Check if we have valid data (NASA returns -999 for missing data)
    if (temp === undefined || temp === null || temp === -999) {
      return null
    }

    // Determine weather condition based on temperature and precipitation
    let condition = "Clear"
    let conditionAr = "صافي"

    if (precipitation > 5) {
      condition = "Rainy"
      conditionAr = "ممطر"
    } else if (temp > 38) {
      condition = "Very Hot"
      conditionAr = "حار جداً"
    } else if (temp > 30) {
      condition = "Hot"
      conditionAr = "حار"
    } else if (temp > 25) {
      condition = "Warm"
      conditionAr = "دافئ"
    } else if (temp > 15) {
      condition = "Mild"
      conditionAr = "معتدل"
    } else {
      condition = "Cool"
      conditionAr = "بارد"
    }

    return {
      temperature: Math.round(temp),
      feelsLike: Math.round(temp + (humidity > 70 ? 2 : 0)),
      condition,
      conditionAr,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 3.6), // Convert m/s to km/h
      uvIndex: Math.round(uvIndex),
      precipitation: Math.round(precipitation),
      source: "nasa",
    }
  } catch (error) {
    return null
  }
}

async function fetchAIPrediction(lat: number, lon: number, date: Date): Promise<WeatherData | null> {
  try {
    const iso = date.toISOString().split("T")[0]
    const url = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"
    const resp = await fetch(`${url}/predict-weather`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, date: iso }),
      // Revalidate per request; avoid Next.js caching issues
      cache: "no-store",
    })
    if (!resp.ok) return null
    const data = await resp.json()

    // Map AI response into WeatherData shape
    const temperature = Math.round(data.temperature)
    const humidity = Math.round(data.humidity)
    const rainProb: number = typeof data.rain_probability === "number" ? data.rain_probability : 0
    const precipitation = Math.round(rainProb * 20) // heuristic for mm estimate

    let condition = "Clear"
    let conditionAr = "صافي"
    if (rainProb > 0.6) {
      condition = "Rainy"
      conditionAr = "ممطر"
    } else if (rainProb > 0.3) {
      condition = "Partly Cloudy"
      conditionAr = "غائم جزئياً"
    } else if (temperature > 38) {
      condition = "Very Hot"
      conditionAr = "حار جداً"
    } else if (temperature > 30) {
      condition = "Hot"
      conditionAr = "حار"
    } else if (temperature > 25) {
      condition = "Warm"
      conditionAr = "دافئ"
    } else if (temperature > 15) {
      condition = "Mild"
      conditionAr = "معتدل"
    } else {
      condition = "Cool"
      conditionAr = "بارد"
    }

    return {
      temperature,
      feelsLike: temperature + (humidity > 60 ? 2 : -1),
      condition,
      conditionAr,
      humidity,
      windSpeed: 10, // placeholder; model not predicting wind yet
      uvIndex: Math.max(1, Math.min(11, Math.floor(temperature / 3.5))),
      precipitation,
      predictionConfidence: typeof data.confidence === "number" ? data.confidence : 0.6,
      rainProbability: rainProb,
      source: "ai",
    }
  } catch (e) {
    return null
  }
}

// Deprecated: replaced by AI prediction. Kept for potential fallback use only.
function generateForecastData(lat: number, lon: number, date: Date): WeatherData {
  const month = date.getMonth()
  const isWinter = month >= 11 || month <= 2
  const isSummer = month >= 5 && month <= 8

  // Base temperature varies by season and location
  let baseTemp = 25
  if (isSummer) baseTemp = 36
  if (isWinter) baseTemp = 18

  // Add variation based on latitude (closer to equator = hotter)
  const latitudeFactor = Math.abs(lat) < 30 ? 5 : 0
  baseTemp += latitudeFactor

  // Add some daily variation
  const dayOfMonth = date.getDate()
  const variation = Math.sin(dayOfMonth / 5) * 3
  const temp = Math.round(baseTemp + variation)

  // Determine conditions
  let condition = "Clear"
  let conditionAr = "صافي"

  if (temp > 38) {
    condition = "Very Hot"
    conditionAr = "حار جداً"
  } else if (temp > 30) {
    condition = "Hot"
    conditionAr = "حار"
  } else if (temp > 25) {
    condition = "Warm"
    conditionAr = "دافئ"
  } else if (temp > 15) {
    condition = "Mild"
    conditionAr = "معتدل"
  } else {
    condition = "Cool"
    conditionAr = "بارد"
  }

  // Add weather variations based on season
  const random = Math.random()
  if (isWinter && random > 0.6) {
    condition = "Partly Cloudy"
    conditionAr = "غائم جزئياً"
  } else if (random > 0.85) {
    condition = "Cloudy"
    conditionAr = "غائم"
  }

  const humidity = isWinter ? 40 + Math.floor(random * 30) : 20 + Math.floor(random * 30)
  const windSpeed = 10 + Math.floor(random * 15)
  const uvIndex = Math.max(1, Math.min(11, Math.floor(temp / 3.5)))

  return {
    temperature: temp,
    feelsLike: temp + (humidity > 60 ? 2 : -1),
    condition,
    conditionAr,
    humidity,
    windSpeed,
    uvIndex,
    precipitation: random > 0.85 ? Math.floor(random * 15) : 0,
    source: "mock",
  }
}

// Mock weather data generator (fallback when NASA API is unavailable)
function generateMockWeatherData(lat: number, lon: number, date: Date): WeatherData {
  const month = date.getMonth()
  const isWinter = month >= 11 || month <= 2
  const isSummer = month >= 5 && month <= 8

  let baseTemp = 20
  if (isSummer) baseTemp = 35
  if (isWinter) baseTemp = 15

  const temp = baseTemp + Math.floor(Math.random() * 10) - 5

  let condition = "Clear"
  let conditionAr = "صافي"

  if (temp > 38) {
    condition = "Very Hot"
    conditionAr = "حار جداً"
  } else if (temp > 35) {
    condition = "Hot"
    conditionAr = "حار"
  } else if (temp > 25) {
    condition = "Warm"
    conditionAr = "دافئ"
  } else if (temp > 15) {
    condition = "Mild"
    conditionAr = "معتدل"
  } else {
    condition = "Cool"
    conditionAr = "بارد"
  }

  const random = Math.random()
  if (random > 0.7) {
    condition = "Partly Cloudy"
    conditionAr = "غائم جزئياً"
  } else if (random > 0.85) {
    condition = "Cloudy"
    conditionAr = "غائم"
  }

  return {
    temperature: temp,
    feelsLike: temp + Math.floor(Math.random() * 5) - 2,
    condition,
    conditionAr,
    humidity: 30 + Math.floor(Math.random() * 40),
    windSpeed: 5 + Math.floor(Math.random() * 20),
    uvIndex: Math.max(1, Math.min(11, Math.floor(temp / 4))),
    precipitation: Math.random() > 0.8 ? Math.floor(Math.random() * 20) : 0,
    source: "mock",
  }
}

// Calculate health index based on weather conditions and event type
export function calculateHealthIndex(weather: WeatherData, eventType: string): HealthIndexData {
  let score = 100
  const tips: string[] = []

  // Temperature impact
  if (weather.temperature > 40) {
    score -= 30
    tips.push("درجة الحرارة مرتفعة جداً - تجنب التعرض المباشر للشمس")
    tips.push("Extreme heat - Avoid direct sun exposure")
    tips.push("اشرب الماء بكثرة كل 15-20 دقيقة")
    tips.push("Drink water frequently every 15-20 minutes")
  } else if (weather.temperature > 35) {
    score -= 20
    tips.push("الطقس حار جداً - ابق في الظل قدر الإمكان")
    tips.push("Very hot weather - Stay in shade when possible")
    tips.push("اشرب الكثير من الماء وتجنب المجهود الشاق")
    tips.push("Stay hydrated and avoid strenuous activities")
  } else if (weather.temperature > 30) {
    score -= 10
    tips.push("الطقس حار - ارتدِ ملابس خفيفة وفاتحة اللون")
    tips.push("Hot weather - Wear light, loose-fitting clothes")
  } else if (weather.temperature < 10) {
    score -= 15
    tips.push("الطقس بارد - ارتدِ طبقات من الملابس الدافئة")
    tips.push("Cold weather - Dress in warm layers")
  } else if (weather.temperature >= 20 && weather.temperature <= 28) {
    tips.push("درجة الحرارة مثالية للأنشطة الخارجية")
    tips.push("Perfect temperature for outdoor activities")
  }

  // UV Index impact
  if (weather.uvIndex > 8) {
    score -= 15
    tips.push("الأشعة فوق البنفسجية عالية جداً - استخدم واقي شمس SPF 50+")
    tips.push("Very high UV index - Use SPF 50+ sunscreen")
    tips.push("ارتدِ قبعة ونظارات شمسية")
    tips.push("Wear a hat and sunglasses")
  } else if (weather.uvIndex > 5) {
    score -= 10
    tips.push("الأشعة فوق البنفسجية متوسطة - استخدم واقي الشمس")
    tips.push("Moderate UV index - Apply sunscreen")
  }

  // Humidity impact
  if (weather.humidity > 70) {
    score -= 10
    tips.push("الرطوبة عالية - قد تشعر بعدم الراحة والتعرق الزائد")
    tips.push("High humidity - May feel uncomfortable and sweaty")
  } else if (weather.humidity < 30) {
    tips.push("الرطوبة منخفضة - استخدم مرطب للبشرة")
    tips.push("Low humidity - Use moisturizer for skin")
  }

  // Wind impact
  if (weather.windSpeed > 30) {
    score -= 10
    tips.push("الرياح قوية - احذر من الأشياء المتطايرة وثبّت الأغراض")
    tips.push("Strong winds - Secure loose objects")
  } else if (weather.windSpeed > 20) {
    tips.push("الرياح معتدلة - قد تحتاج لسترة خفيفة")
    tips.push("Moderate winds - Light jacket recommended")
  }

  // Precipitation
  if (weather.precipitation > 10) {
    score -= 15
    tips.push("أمطار غزيرة متوقعة - احمل مظلة وارتدِ ملابس مقاومة للماء")
    tips.push("Heavy rain expected - Bring umbrella and waterproof clothing")
  } else if (weather.precipitation > 0) {
    tips.push("احتمال هطول أمطار خفيفة - احمل مظلة")
    tips.push("Light rain possible - Bring an umbrella")
  }

  // Event-specific recommendations
  if (eventType === "outdoor") {
    if (weather.temperature > 30 || weather.temperature < 15) {
      score -= 10
      tips.push("الطقس غير مثالي للأنشطة الخارجية الطويلة")
      tips.push("Weather not ideal for extended outdoor activities")
    } else {
      tips.push("الطقس مناسب للفعاليات الخارجية")
      tips.push("Good weather for outdoor events")
    }
  } else if (eventType === "sports") {
    if (weather.temperature > 32) {
      score -= 15
      tips.push("الحرارة مرتفعة للرياضة - خذ فترات راحة متكررة")
      tips.push("Too hot for sports - Take frequent breaks")
    } else if (weather.temperature >= 18 && weather.temperature <= 28) {
      tips.push("درجة حرارة ممتازة للأنشطة الرياضية")
      tips.push("Excellent temperature for sports activities")
    }
  } else if (eventType === "wedding") {
    if (weather.temperature > 35) {
      tips.push("وفّر مناطق مظللة ومكيفة للضيوف")
      tips.push("Provide shaded and air-conditioned areas for guests")
    }
    if (weather.windSpeed > 20) {
      tips.push("الرياح قد تؤثر على الديكورات الخارجية")
      tips.push("Wind may affect outdoor decorations")
    }
  } else if (eventType === "picnic") {
    if (weather.temperature >= 20 && weather.temperature <= 28 && weather.precipitation === 0) {
      tips.push("طقس مثالي للنزهات!")
      tips.push("Perfect weather for picnics!")
    }
  }

  // Add positive tips if conditions are good and no event type selected
  if (score > 80 && !eventType) {
    tips.push("الطقس ممتاز - يوم رائع للأنشطة الخارجية")
    tips.push("Excellent weather - Great day for outdoor activities")
  }

  // Ensure we always have at least some tips
  if (tips.length === 0) {
    tips.push("الطقس معتدل - استمتع بيومك")
    tips.push("Moderate weather - Enjoy your day")
  }

  // Determine status
  let status: "good" | "moderate" | "poor"
  let statusText: string
  let statusTextAr: string

  if (score >= 75) {
    status = "good"
    statusText = "Excellent Conditions"
    statusTextAr = "ظروف ممتازة"
  } else if (score >= 50) {
    status = "moderate"
    statusText = "Moderate Conditions"
    statusTextAr = "ظروف معتدلة"
  } else {
    status = "poor"
    statusText = "Poor Conditions"
    statusTextAr = "ظروف سيئة"
  }

  return {
    status,
    statusText,
    statusTextAr,
    score: Math.max(0, Math.min(100, score)),
    tips,
  }
}
