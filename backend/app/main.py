from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import create_database_if_not_exists

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically ensure database exists on startup in development
    if settings.APP_ENV == "development":
        await create_database_if_not_exists()
    yield


app = FastAPI(
    title="FinTrack API",
    description="Personal Expense Tracker REST API (V1 / MVP)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "app": "FinTrack API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }
