"""
main.py — FastAPI entry point

Startup sequence:
  1. start_all_readers()     → one FrameReader thread per camera (reads RTSP → camera_state)
  2. start_all_workers()     → one YOLO asyncio task per camera (inference on camera_state)
  3. WebSocket router mounts at /ws/video/{camera_id}
"""

import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from camera.manager import start_all_readers, stop_all_readers
from websocket.video import router as video_router
from yolo.detector import start_all_workers

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    start_all_readers()        # sync — spins up daemon threads, no await needed
    await start_all_workers()  # async — creates one asyncio task per camera
    yield
    # ── Shutdown ─────────────────────────────────────────────────
    stop_all_readers()         # signals all FrameReader threads to exit


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
