#!/bin/bash

# AI Weather Prediction Startup Script
# This script sets up and starts the weather prediction ML model and API server

echo "🌤️  Setting up AI Weather Prediction System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "ml-model/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd ml-model
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
echo "📚 Installing ML dependencies..."
source ml-model/venv/bin/activate
pip install -r ml-model/requirements.txt

# Train initial model if it doesn't exist
if [ ! -f "ml-model/weather_predictor.pkl" ]; then
    echo "🤖 Training initial weather prediction model (this may take a few minutes)..."
    cd ml-model
    python weather_predictor.py
    cd ..
fi

# Install FastAPI server dependencies
echo "🚀 Installing server dependencies..."
pip install -r server/requirements.txt

# Start the FastAPI server
echo "🌐 Starting AI Weather Prediction API server..."
echo "Server will be available at http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"

cd server
python main.py