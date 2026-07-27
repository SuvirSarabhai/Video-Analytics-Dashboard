"""
camera/manager.py

Reads RTSP streams from MediaMTX and stores the latest frame
for each camera.

Only this module reads the cameras.
Other modules (YOLO, WebSocket, Recorder) use camera_state.
"""

import cv2
import asyncio
import logging
import time

logger = logging.getLogger(__name__)

# RTSP streams from MediaMTX
CAMERAS = {
    "cam1": "rtsp://localhost:8554/cam1",   # phone publishes to MediaMTX; Python reads locally
   # "cam2": "rtsp://localhost:8554/cam1",   # mine1.mp4
   # "cam3": "rtsp://localhost:8554/cam1",   # mine2.mp4
   # "cam4": "rtsp://localhost:8554/cam1",   # factory.mp4
}

# Shared camera state
camera_state = {
    camera_id: {
        "frame": None,
        "timestamp": None,
        "connected": False,
    }
    for camera_id in CAMERAS
}

AI_FPS = 5
FRAME_INTERVAL = 1.0 / AI_FPS


async def read_camera(camera_id: str):
    """
    Continuously reads frames from one RTSP stream.
    Automatically reconnects if the stream disconnects.
    """

    url = CAMERAS[camera_id]
    loop = asyncio.get_running_loop()

    while True:

        logger.info(f"[{camera_id}] Connecting to {url}")

        cap = cv2.VideoCapture(url)

        if not cap.isOpened():
            logger.warning(f"[{camera_id}] Unable to connect. Retrying...")
            camera_state[camera_id]["connected"] = False
            await asyncio.sleep(3)
            continue

        logger.info(f"[{camera_id}] Connected")
        camera_state[camera_id]["connected"] = True

        try:
            while True:

                start = time.time()

                ret, frame = await loop.run_in_executor(
                    None,
                    cap.read
                )

                if not ret:
                    logger.warning(f"[{camera_id}] Stream lost")
                    camera_state[camera_id]["connected"] = False
                    break

                # Resize for YOLO
                frame = cv2.resize(frame, (640, 640))

                # Store BGR frame
                camera_state[camera_id]["frame"] = frame
                camera_state[camera_id]["timestamp"] = time.time()

                elapsed = time.time() - start

                if elapsed < FRAME_INTERVAL:
                    await asyncio.sleep(FRAME_INTERVAL - elapsed)

        except Exception:
            logger.exception(f"[{camera_id}] Camera error")

        finally:
            cap.release()

        logger.info(f"[{camera_id}] Reconnecting in 2 seconds...")
        await asyncio.sleep(2)


async def start_all_readers():
    """
    Starts one background task per camera.
    Call once during FastAPI startup.
    """

    tasks = []

    for camera_id in CAMERAS:
        task = asyncio.create_task(read_camera(camera_id))
        tasks.append(task)

    logger.info(f"Started {len(tasks)} camera readers")

    return tasks