# Weather Event Planner with AI Predictions 🌤️🤖

A modern, AI-powered weather event planning application that predicts future weather conditions using machine learning models trained on NASA historical weather data.

## ✨ Features

### 🔥 New AI Integration
- **AI Weather Predictions**: Machine learning models predict future weather using NASA historical data
- **Prediction Confidence Meter**: Shows how confident the AI is about its predictions
- **Interactive Weather Trends Chart**: Visualizes 7-day history + 3-day AI forecast
- **AI/NASA Data Toggle**: Switch between AI predictions and NASA-only data
- **Beautiful Glassmorphism UI**: Modern design with smooth animations using Framer Motion

### 🌟 Core Features  
- **Real-time Weather Data**: Fetches historical data from NASA POWER API
- **Health Weather Index**: Calculates personalized health recommendations
- **Event Planning**: Optimized recommendations for different event types
- **Multi-language Support**: Arabic (RTL) and English
- **Location Services**: GPS, search, and interactive map selection
- **Responsive Design**: Works perfectly on all devices

## 🏗️ Architecture

```
Weather Event Planner/
├── 🤖 ML Model (/ml-model/)
│   ├── weather_predictor.py    # Random Forest ML model
│   ├── requirements.txt        # ML dependencies
│   └── weather_predictor.pkl   # Trained model (auto-generated)
│
├── 🚀 AI API Server (/server/)
│   ├── main.py                 # FastAPI server
│   └── requirements.txt        # Server dependencies
│
├── 🎨 Next.js Frontend (/)
│   ├── components/             # React components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities and types
│   └── app/                    # Next.js 13+ app directory
│
└── 📜 Scripts
    ├── start-ai-server.sh      # Linux/Mac startup
    └── start-ai-server.bat     # Windows startup
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **pnpm**
- **Python** 3.8+ with **pip**
- Internet connection (for NASA API and model training)

### 1️⃣ Clone and Install
```bash
git clone <repository-url>
cd weather-event-planner

# Install Next.js dependencies
pnpm install
```

### 2️⃣ Start AI Server (Required for AI predictions)

**On Linux/Mac:**
```bash
./start-ai-server.sh
```

**On Windows:**
```cmd
start-ai-server.bat
```

This will:
- Create Python virtual environment
- Install ML dependencies (scikit-learn, pandas, etc.)
- Train initial weather model using NASA data (takes ~2-3 minutes)
- Start FastAPI server on http://localhost:8000

### 3️⃣ Start Next.js Development Server
```bash
# In a new terminal
pnpm dev
```

Visit http://localhost:3000 to see the application!

## 🤖 AI Model Details

### Training Data
- **Source**: NASA POWER API historical weather data
- **Features**: Temperature, humidity, precipitation, wind speed, UV index
- **Time Range**: Up to 365 days of historical data
- **Location**: Customizable (default: Riyadh, Saudi Arabia)

### Model Architecture
- **Algorithm**: Random Forest Regressor (ensemble method)
- **Predictions**: Next-day temperature, humidity, rain probability
- **Features**: 20+ engineered features including:
  - Seasonal patterns (month, day of year)
  - Moving averages (7-day trends) 
  - Lag features (1, 2, 3, 7 day lags)
  - Cyclical encodings (sine/cosine of dates)

### Performance
- **Temperature**: Typical R² > 0.8, RMSE < 3°C
- **Humidity**: Typical R² > 0.7, RMSE < 10%
- **Rain Probability**: Classification accuracy > 75%

## 🎨 UI Components

### New AI Components
- **`WeatherForecastCard`**: Beautiful gradient cards with AI badges
- **`PredictionConfidenceMeter`**: Animated confidence indicators
- **`WeatherTrendsChart`**: Interactive Recharts visualization
- **`WeatherDataSourceToggle`**: AI vs NASA data switch

### Enhanced Components
- **`WeatherDisplay`**: Now shows AI prediction badges and confidence
- **`useWeatherPrediction`**: Smart hook for AI weather data
- **Framer Motion**: Smooth animations throughout the app

## 🔧 Configuration

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

### API Endpoints
- **Health Check**: `GET /health`
- **Predict Weather**: `POST /predict-weather`
- **Docs**: http://localhost:8000/docs (Interactive Swagger UI)

## 🛠️ Development

### Training New Models
```bash
cd ml-model
python weather_predictor.py [latitude] [longitude] [days_back]

# Examples:
python weather_predictor.py 24.7136 46.6753 365  # Riyadh
python weather_predictor.py 40.7128 -74.0060 180  # New York
```

### API Testing
```bash
# Test prediction endpoint
curl -X POST "http://localhost:8000/predict-weather" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 24.7136,
    "lon": 46.6753,
    "current_weather": {
      "temperature": 30,
      "humidity": 45,
      "precipitation": 0
    }
  }'
```

## 📱 Screenshots

### AI Weather Prediction
![AI Prediction with Confidence Meter](screenshot-ai-prediction.png)

### Weather Trends Chart  
![7-day History + 3-day AI Forecast](screenshot-trends-chart.png)

### Data Source Toggle
![Switch between AI and NASA data](screenshot-toggle.png)

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Deploy Next.js app
pnpm build
# Deploy to Vercel, Netlify, etc.
```

### AI Server (Railway, Render, etc.)
```dockerfile
# Dockerfile for AI server
FROM python:3.9-slim
COPY server/ /app/
COPY ml-model/ /app/ml-model/
WORKDIR /app
RUN pip install -r requirements.txt
RUN pip install -r ml-model/requirements.txt
EXPOSE 8000
CMD ["python", "main.py"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA POWER API** for historical weather data
- **scikit-learn** for machine learning capabilities
- **FastAPI** for the fast, modern Python API
- **Next.js** and **React** for the beautiful frontend
- **Framer Motion** for smooth animations
- **Recharts** for interactive data visualization

---

Made with ❤️ for better weather-based event planning using AI