# SmartCRM Builder

> AI-powered CRM builder platform - Build intelligent CRM systems with ease

## 🚀 Project Overview

SmartCRM Builder is a modern, AI-powered CRM platform that helps businesses create and manage customer relationships efficiently. Built with cutting-edge technologies and best practices.

## 🏗️ Architecture

This is a **monorepo** containing:

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: Next.js 14 (App Router) + Refine.dev
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 API
- **UI**: Material-UI (MUI)

## 📁 Project Structure

```
smartcrm/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Pydantic models
│   │   └── utils/          # Helper functions
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/               # Next.js + Refine
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── providers/     # Refine providers
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── shared/                 # Shared types/configs
│   └── types.ts
│
├── docker-compose.yml      # Local development
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm/yarn
- **Docker & Docker Compose** (for local Supabase)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smartcrm
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Run the development server
python -m app.main
```

Backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/api/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your actual values

# Run the development server
npm run dev
# or
yarn dev
```

Frontend will be available at: `http://localhost:3000`

### 4. Database Setup (Local Supabase)

```bash
# From the root directory

# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Start Supabase services
docker-compose up -d

# Access Supabase Studio
# Open http://localhost:3050
```

**Supabase Services:**
- Studio UI: `http://localhost:3050`
- API Gateway: `http://localhost:8000`
- PostgreSQL: `localhost:54322`

## 🔑 Environment Variables

### Backend (.env)

```env
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
OPENAI_API_KEY=sk-your-openai-api-key
SECRET_KEY=your-secret-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📦 Key Dependencies

### Backend
- `fastapi[all]` - Modern web framework
- `uvicorn` - ASGI server
- `supabase` - Database client
- `openai` - AI integration
- `pydantic-settings` - Configuration management
- `sqlalchemy` - ORM
- `asyncpg` - Async PostgreSQL driver

### Frontend
- `next` - React framework
- `@refinedev/core` - Headless framework for CRUD apps
- `@refinedev/mui` - Material-UI integration
- `@refinedev/supabase` - Supabase data provider
- `@mui/material` - Material-UI components
- `@supabase/supabase-js` - Supabase client

## 🚀 Development Workflow

1. **Start Database**: `docker-compose up -d`
2. **Start Backend**: `cd backend && python -m app.main`
3. **Start Frontend**: `cd frontend && npm run dev`
4. **Access Applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/api/docs
   - Supabase Studio: http://localhost:3050

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## 📝 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ using FastAPI, Next.js, and Refine.dev**
