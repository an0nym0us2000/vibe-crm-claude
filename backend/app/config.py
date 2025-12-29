"""
Application configuration using Pydantic Settings
Loads environment variables with validation and type checking
"""
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import secrets


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    All settings are strongly typed and validated
    """
    
    # ========================================
    # Application Settings
    # ========================================
    APP_NAME: str = "SmartCRM Builder API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    
    # ========================================
    # API Configuration
    # ========================================
    API_PREFIX: str = Field(default="/api/v1", description="API route prefix")
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: int = Field(default=8000, description="API port")
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3003",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3003",
        ],
        description="CORS allowed origins"
    )
    ALLOW_CREDENTIALS: bool = True
    ALLOW_METHODS: List[str] = ["*"]
    ALLOW_HEADERS: List[str] = ["*"]
    
    # ========================================
    # Database (Supabase) Configuration
    # ========================================
    SUPABASE_URL: str = Field(
        default="",
        description="Supabase project URL"
    )
    SUPABASE_KEY: str = Field(
        default="",
        description="Supabase anonymous key (client-side)"
    )
    SUPABASE_SERVICE_KEY: str = Field(
        default="",
        description="Supabase service role key (server-side only)"
    )
    DATABASE_URL: str = Field(
        default="",
        description="PostgreSQL connection string"
    )
    
    @field_validator("SUPABASE_URL", "SUPABASE_KEY")
    @classmethod
    def validate_supabase_required(cls, v: str, info) -> str:
        """Validate that required Supabase settings are provided"""
        if not v and info.data.get("ENVIRONMENT") == "production":
            raise ValueError(f"{info.field_name} is required in production")
        return v
    
    # ========================================
    # OpenAI Configuration
    # ========================================
    OPENAI_API_KEY: str = Field(
        default="",
        description="OpenAI API key for AI features"
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4",
        description="Default OpenAI model"
    )
    OPENAI_MAX_TOKENS: int = Field(
        default=2000,
        ge=1,
        le=4096,
        description="Maximum tokens for AI generation"
    )
    OPENAI_TEMPERATURE: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Temperature for AI generation"
    )
    
    # ========================================
    # Security Configuration
    # ========================================
    SECRET_KEY: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Secret key for JWT encoding"
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="JWT algorithm"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        ge=1,
        description="Access token expiration in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        ge=1,
        description="Refresh token expiration in days"
    )
    
    # ========================================
    # Rate Limiting
    # ========================================
    RATE_LIMIT_ENABLED: bool = Field(
        default=True,
        description="Enable rate limiting"
    )
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60,
        ge=1,
        description="Max requests per minute"
    )
    
    # ========================================
    # Redis (Caching & Sessions)
    # ========================================
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    REDIS_ENABLED: bool = Field(
        default=False,
        description="Enable Redis for caching"
    )
    CACHE_TTL: int = Field(
        default=300,
        ge=0,
        description="Default cache TTL in seconds"
    )
    
    # ========================================
    # Logging Configuration
    # ========================================
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Logging level"
    )
    LOG_FORMAT: str = Field(
        default="json",
        description="Log format: json or text"
    )
    
    # ========================================
    # File Upload Settings
    # ========================================
    MAX_UPLOAD_SIZE: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum file upload size in bytes"
    )
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = Field(
        default=["jpg", "jpeg", "png", "pdf", "csv", "xlsx"],
        description="Allowed file upload extensions"
    )
    
    # ========================================
    # Email Configuration (Optional)
    # ========================================
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    
    # ========================================
    # Pydantic Configuration
    # ========================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra environment variables
    )
    
    # ========================================
    # Helper Properties
    # ========================================
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT == "development"
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
        return self.ALLOWED_ORIGINS
    
    def get_database_url(self, async_driver: bool = False) -> str:
        """
        Get database URL with optional async driver
        
        Args:
            async_driver: If True, use asyncpg driver
            
        Returns:
            Database connection URL
        """
        if not self.DATABASE_URL:
            return ""
        
        if async_driver and not self.DATABASE_URL.startswith("postgresql+asyncpg"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        
        return self.DATABASE_URL


# ========================================
# Global Settings Instance
# ========================================
settings = Settings()


# ========================================
# Helper Functions
# ========================================
def get_settings() -> Settings:
    """
    Dependency injection function for FastAPI
    
    Returns:
        Settings instance
    """
    return settings
