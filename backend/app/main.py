from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import booking, calls, webhook

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    port = os.getenv("PORT", "8000")
    logger.info("Starting API on 0.0.0.0:%s", port)
    try:
        init_db()
    except Exception:
        logger.exception("Database initialization failed")
        raise
    yield


app = FastAPI(title="Booking AI Voice Agent API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook.router)
app.include_router(booking.router)
app.include_router(calls.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "booking-ai-voice-agent"}


@app.get("/health")
def health():
    return {"status": "ok"}
