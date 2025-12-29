@echo off
echo =====================================
echo  SmartCRM Builder - Setup Script
echo =====================================
echo.

echo [1/4] Setting up backend environment variables...
cd backend
if not exist .env (
    copy .env.example .env
    echo Created backend\.env - Please update with your API keys
) else (
    echo backend\.env already exists
)
cd ..

echo.
echo [2/4] Setting up frontend environment variables...
cd frontend
if not exist .env.local (
    copy .env.local.example .env.local
    echo Created frontend\.env.local - Please update with your API keys
) else (
    echo frontend\.env.local already exists
)
cd ..

echo.
echo [3/4] Setting up Docker environment variables...
if not exist .env (
    copy .env.example .env
    echo Created .env - Please update with your credentials
) else (
    echo .env already exists
)

echo.
echo [4/4] Installing backend dependencies...
cd backend
if exist venv\ (
    echo Virtual environment already exists
) else (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment and installing packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

echo.
echo =====================================
echo  Setup Complete!
echo =====================================
echo.
echo Next steps:
echo 1. Edit .env files with your actual API keys
echo 2. Run: docker-compose up -d (for Supabase)
echo 3. Run: cd backend ^&^& venv\Scripts\activate ^&^& python -m app.main
echo 4. Run: cd frontend ^&^& npm run dev
echo.
echo See QUICKSTART.md for detailed instructions
pause
