# SmartCRM Builder - Quick Start Guide

## ✅ Setup Complete!

The monorepo structure has been successfully created with:
- ✓ Backend (FastAPI + Python)
- ✓ Frontend (Next.js 14 + Refine.dev)
- ✓ Shared types
- ✓ Docker configuration
- ✓ Dependencies installed

## 🚀 Next Steps

### 1. Configure Environment Variables

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values (Supabase, OpenAI keys)
```

#### Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and keys
```

#### Docker (Supabase)
```bash
# From root directory
cp .env.example .env
# Edit .env with database passwords
```

### 2. Install Backend Dependencies

```bash
cd backend
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
```

### 3. Start Development Servers

Open 3 terminal windows:

**Terminal 1 - Database (Supabase)**
```bash
docker-compose up -d
```

**Terminal 2 - Backend API**
```bash
cd backend
.\venv\Scripts\activate
python -m app.main
```

**Terminal 3 - Frontend**
```bash
cd frontend
npm run dev
```

### 4. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Supabase Studio**: http://localhost:3050

## 📦 What's Included

### Backend Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── api/                 # API routes (to be added)
│   ├── services/
│   │   ├── ai_service.py    # OpenAI integration
│   │   └── db_service.py    # Supabase client
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   └── utils/               # Helper functions
└── requirements.txt
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with Refine
│   │   └── page.tsx         # Home page
│   ├── providers/
│   │   ├── theme-provider.tsx    # MUI theme
│   │   ├── auth-provider.ts      # Auth integration
│   │   └── supabase-client.ts    # Supabase client
│   ├── components/
│   │   └── StatCard.tsx     # Reusable stat card
│   └── utils/
│       └── index.ts         # Utility functions
└── package.json
```

## 🛠️ Key Features Configured

✅ **FastAPI Backend**
- CORS middleware
- Health check endpoints
- Pydantic settings management
- OpenAI service integration
- Supabase database service

✅ **Next.js Frontend**
- App Router (Next.js 14)
- Refine.dev framework
- Material-UI theme
- Supabase authentication
- TypeScript configuration

✅ **Development Tools**
- Docker Compose for local Supabase
- Hot reload for both frontend and backend
- API documentation (Swagger/ReDoc)
- TypeScript type safety

## 📝 Important Notes

1. **Environment Variables**: Don't forget to set up your `.env` files!
2. **Supabase**: The docker-compose.yml includes a full Supabase stack
3. **OpenAI API**: You'll need an OpenAI API key for AI features
4. **Dependencies**: Frontend installed with `--legacy-peer-deps` due to Refine version compatibility

## 🔐 Required API Keys

You will need:
- Supabase Project URL and Keys (or use local Docker setup)
- OpenAI API Key (for AI features)

## 🐛 Troubleshooting

### Frontend Build Issues
If you encounter peer dependency issues:
```bash
cd frontend
npm install --legacy-peer-deps
```

### Backend Virtual Environment
If venv activation fails:
```powershell
# Windows PowerShell (may need to allow script execution)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Docker Issues
If ports are already in use, update port mappings in `docker-compose.yml`

## 📚 Next Development Steps

1. **Database Schema**: Create tables in Supabase
2. **API Routes**: Add endpoints in `backend/app/api/`
3. **Frontend Pages**: Add CRM pages in `frontend/src/app/`
4. **Auth Flow**: Implement login/register pages
5. **AI Features**: Build AI-powered CRM features

## 🎯 Ready to Build!

Your SmartCRM Builder monorepo is ready for development. Start building amazing AI-powered CRM features! 🚀
