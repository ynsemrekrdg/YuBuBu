"""
YuBuBu Education Platform - Main Application Entry Point

A cross-platform education application for children with learning difficulties.
Built with FastAPI, SQLAlchemy, and Claude AI.
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.infrastructure.cache.redis_cache import redis_cache
from app.infrastructure.database.session import close_db, init_db

# ─── Logging Configuration ──────────────────────────────────

# Remove default loguru handler
logger.remove()

# Add console handler
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
)

# Add file handler
log_path = Path(settings.LOG_FILE)
log_path.parent.mkdir(parents=True, exist_ok=True)
logger.add(
    settings.LOG_FILE,
    rotation="10 MB",
    retention="30 days",
    compression="zip",
    level=settings.LOG_LEVEL,
)


# ─── Rate Limiter ───────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)


# ─── Application Lifespan ───────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting YuBuBu Education Platform...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug: {settings.DEBUG}")

    # Initialize database
    try:
        await init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

    # Connect Redis
    try:
        await redis_cache.connect()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed (caching disabled): {e}")

    logger.info("✅ YuBuBu Platform is ready!")

    yield

    # Shutdown
    logger.info("🔄 Shutting down YuBuBu Platform...")
    await redis_cache.disconnect()
    await close_db()
    logger.info("👋 YuBuBu Platform stopped")


# ─── FastAPI Application ────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description="""
## YuBuBu Eğitim Platformu API

Öğrenme güçlüğü çeken çocuklar için kişiselleştirilmiş eğitim platformu.

### Desteklenen Özel Öğrenme Güçlükleri:
- **Disleksi**: Kelime tanıma, harf eşleştirme, sesli geri bildirim
- **Disgrafi**: Harf yazma, el yazısı pratiği, motor beceri egzersizleri
- **Diskalkuli**: Görsel matematik, sayı çizgisi, somut örnekler

### Özellikler:
- 🤖 AI destekli kişiselleştirilmiş öğrenme
- 🏆 Gamification (puan, rozet, seviye)
- 📊 Detaylı ilerleme takibi
- 👨‍👩‍👧 Veli ve öğretmen paneli
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiter state
app.state.limiter = limiter


# ─── Middleware ──────────────────────────────────────────────

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Exception Handlers ─────────────────────────────────────

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": "Çok fazla istek gönderildi. Lütfen biraz bekleyin.",
            "retry_after": str(exc.detail),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    """Handle Pydantic validation errors with Turkish messages."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Geçersiz veri gönderildi",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."},
    )


# ─── Register Routes ────────────────────────────────────────

from app.api.routes.auth_routes import router as auth_router
from app.api.routes.student_routes import router as student_router
from app.api.routes.chapter_routes import router as chapter_router
from app.api.routes.progress_routes import router as progress_router
from app.api.routes.ai_routes import router as ai_router

app.include_router(auth_router)
app.include_router(student_router)
app.include_router(chapter_router)
app.include_router(progress_router)
app.include_router(ai_router)


# ─── Health Check ────────────────────────────────────────────

@app.get(
    "/health",
    tags=["System"],
    summary="Sağlık Kontrolü",
    description="Sistem sağlık durumunu kontrol eder.",
)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "redis_connected": redis_cache.is_connected,
    }


@app.get("/", tags=["System"])
async def root():
    """Root endpoint - redirects to docs."""
    return {
        "message": "YuBuBu Eğitim Platformu API'sine hoş geldiniz! 🎓",
        "docs": "/docs",
        "health": "/health",
    }


# ─── Run with Uvicorn ───────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
