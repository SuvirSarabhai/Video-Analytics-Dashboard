"""
main.py — FastAPI entry point

Startup sequence:
  1. start_all_readers() → one asyncio task per camera (reads RTSP → camera_state)
  2. WebSocket router mounts at /ws/video/{camera_id}
"""

import asyncio
import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from camera.manager import start_all_readers
from websocket.video import router as video_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    tasks = await start_all_readers()
    yield
    # ── Shutdown ─────────────────────────────────────────────────
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)


app = FastAPI(title="Video Analytics", lifespan=lifespan)

# Allow the Vite dev server to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
