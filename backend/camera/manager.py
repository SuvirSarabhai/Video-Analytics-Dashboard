"""
camera/manager.py

Reads RTSP streams from MediaMTX and stores the latest frame
for each camera.

Buffer-drain strategy (ported from threads.py):
  A dedicated daemon thread calls cap.read() in a tight loop to
  continuously drain the RTSP decode buffer.  Only the newest frame
  is kept (under a threading.Lock), so the YOLO worker always gets
  the most-recent image — never a stale one from a backed-up buffer.

Only this module reads the cameras.
Other modules (YOLO, WebSocket, Recorder) use camera_state.
"""

import cv2 
import asyncio
import logging
import os
import threading
import time

logger = logging.getLogger(__name__)

# Force TCP transport so RTSP decode buffer stays manageable
os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")

# RTSP streams from MediaMTX
CAMERAS = {
    "cam1": "rtsp://localhost:8554/cam1",   # phone publishes to MediaMTX; Python reads locally
   # "cam2": "rtsp://localhost:8554/cam1",   # mine1.mp4
   # "cam3": "rtsp://localhost:8554/cam1",   # mine2.mp4
   # "cam4": "rtsp://localhost:8554/cam1",   # factory.mp4
}

# Shared camera state — populated by FrameReader instances
camera_state = {
    camera_id: {
        "frame":     None,
        "timestamp": None,
        "connected": False,
    }
    for camera_id in CAMERAS
}


class FrameReader:
    """
    Mirrors the FrameReader in threads.py.

    Opens an RTSP stream and drains its decode buffer as fast as
    possible in a daemon thread.  Only the latest decoded frame is
    kept, so consumers never receive a stale/buffered image.

    Usage:
        reader = FrameReader("cam1", "rtsp://...")
        frame  = reader.get_frame()   # None until first frame arrives
    """

    def __init__(self, camera_id: str, url: str):
        self.camera_id = camera_id
        self.url       = url
        self._frame    = None
        self._lock     = threading.Lock()
        self._stop     = threading.Event()

        # DO NOT set CAP_PROP_BUFFERSIZE — it does nothing for RTSP.
        # Drain the buffer continuously in a thread instead.
        t = threading.Thread(target=self._read_loop, daemon=True, name=f"FrameReader-{camera_id}")
        t.start()

    # ------------------------------------------------------------------
    # Background thread — runs at full camera FPS to drain the buffer
    # ------------------------------------------------------------------
    def _read_loop(self):
        while not self._stop.is_set():
            cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)

            if not cap.isOpened():
                logger.warning(f"[{self.camera_id}] Unable to connect to {self.url}. Retrying in 3 s…")
                camera_state[self.camera_id]["connected"] = False
                time.sleep(3)
                continue

            logger.info(f"[{self.camera_id}] Connected")
            camera_state[self.camera_id]["connected"] = True

            try:
                while not self._stop.is_set():
                    ret, frame = cap.read()   # drains buffer as fast as possible

                    if not ret:
                        logger.warning(f"[{self.camera_id}] Stream lost")
                        camera_state[self.camera_id]["connected"] = False
                        break

                    # Resize here so every consumer gets a ready-to-use frame
                    frame = cv2.resize(frame, (640, 640))

                    # Always overwrite — only the latest frame survives
                    with self._lock:
                        self._frame = frame

                    camera_state[self.camera_id]["frame"]     = self.get_frame()
                    camera_state[self.camera_id]["timestamp"] = time.time()

            except Exception:
                logger.exception(f"[{self.camera_id}] Camera error")
            finally:
                cap.release()

            if not self._stop.is_set():
                logger.info(f"[{self.camera_id}] Reconnecting in 2 s…")
                time.sleep(2)

    # ------------------------------------------------------------------
    # Public API — called by async consumers
    # ------------------------------------------------------------------
    def get_frame(self):
        """Return a copy of the latest frame, or None if not yet available."""
        with self._lock:
            return self._frame.copy() if self._frame is not None else None

    def stop(self):
        """Signal the background thread to exit cleanly."""
        self._stop.set()


# Module-level registry of active readers
_readers: dict[str, FrameReader] = {}


def start_all_readers() -> None:
    """
    Instantiate one FrameReader per camera.
    Call once during FastAPI startup (synchronous — no event loop needed).

    Replaces the old async start_all_readers() coroutine.  Because the
    heavy lifting (cap.read) now happens in daemon threads, we no longer
    need run_in_executor or asyncio tasks for frame capture.
    """
    for camera_id, url in CAMERAS.items():
        reader = FrameReader(camera_id, url)
        _readers[camera_id] = reader
        logger.info(f"[{camera_id}] FrameReader started → {url}")

    logger.info(f"Started {len(_readers)} camera reader(s)")


def stop_all_readers() -> None:
    """Gracefully stop all FrameReader threads (e.g. on shutdown)."""
    for reader in _readers.values():
        reader.stop()
    _readers.clear()