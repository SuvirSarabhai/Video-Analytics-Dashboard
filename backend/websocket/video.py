import asyncio
import cv2

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from camera.manager import camera_state
from yolo.detector import alert_queues

router = APIRouter()


@router.websocket("/ws/video/{camera_id}")
async def video_stream(websocket: WebSocket, camera_id: str):

    # Check camera exists
    if camera_id not in camera_state:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    try:
        while True:

            frame = camera_state[camera_id]["frame"]

            # Camera hasn't produced a frame yet
            if frame is None:
                await asyncio.sleep(0.05)
                continue

            # Resize to 16:9 for browser display (camera_state holds 640×640 for YOLO)
            display_frame = cv2.resize(frame, (640, 360))

            # Encode numpy frame as JPEG
            success, buffer = cv2.imencode(".jpg", display_frame)

            if not success:
                continue

            # Send binary JPEG
            await websocket.send_bytes(buffer.tobytes())

            # ~10 FPS to browser
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        print(f"{camera_id} disconnected")

    except Exception as e:
        print(e)


@router.websocket("/ws/alerts/{camera_id}")
async def alert_stream(websocket: WebSocket, camera_id: str):
    """Stream YOLO detection events as JSON to the browser."""

    if camera_id not in alert_queues:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    try:
        while True:
            # Block until the YOLO worker puts a batch of events in the queue
            events = await alert_queues[camera_id].get()
            await websocket.send_json(events)

    except WebSocketDisconnect:
        print(f"[alerts] {camera_id} disconnected")

    except Exception as e:
        print(e)