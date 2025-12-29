#!/bin/bash

echo "====================================="
echo " SmartCRM Builder - Setup Script"
echo "====================================="
echo ""

echo "[1/4] Setting up backend environment variables..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created backend/.env - Please update with your API keys"
else
    echo "backend/.env already exists"
fi
cd ..

echo ""
echo "[2/4] Setting up frontend environment variables..."
cd frontend
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "Created frontend/.env.local - Please update with your API keys"
else
    echo "frontend/.env.local already exists"
fi
cd ..

echo ""
echo "[3/4] Setting up Docker environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env - Please update with your credentials"
else
    echo ".env already exists"
fi

echo ""
echo "[4/4] Setting up backend dependencies..."
cd backend
if [ ! -d venv ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists"
fi

echo "Activating virtual environment and installing packages..."
source venv/bin/activate
pip install -r requirements.txt
cd ..

echo ""
echo "====================================="
echo " Setup Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Edit .env files with your actual API keys"
echo "2. Run: docker-compose up -d (for Supabase)"
echo "3. Run: cd backend && source venv/bin/activate && python -m app.main"
echo "4. Run: cd frontend && npm run dev"
echo ""
echo "See QUICKSTART.md for detailed instructions"
