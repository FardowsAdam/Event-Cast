@echo off
echo 🌤️  Setting up AI Weather Prediction System...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "ml-model\venv" (
    echo 📦 Creating virtual environment...
    cd ml-model
    python -m venv venv
    cd ..
)

REM Activate virtual environment and install dependencies
echo 📚 Installing ML dependencies...
call ml-model\venv\Scripts\activate.bat
pip install -r ml-model\requirements.txt

REM Train initial model if it doesn't exist
if not exist "ml-model\weather_predictor.pkl" (
    echo 🤖 Training initial weather prediction model (this may take a few minutes)...
    cd ml-model
    python weather_predictor.py
    cd ..
)

REM Install FastAPI server dependencies
echo 🚀 Installing server dependencies...
pip install -r server\requirements.txt

REM Start the FastAPI server
echo 🌐 Starting AI Weather Prediction API server...
echo Server will be available at http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Press Ctrl+C to stop the server

cd server
python main.py
pause