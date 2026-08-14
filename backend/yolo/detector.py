import asyncio
import logging
import time
from ultralytics import YOLO
from camera.manager import camera_state

logger = logging.getLogger(__name__)

model = YOLO("best.pt")  # swap with your PPE weights later

alert_queues = {
    cam_id: asyncio.Queue(maxsize=10)
    for cam_id in camera_state  # only create queues for active cameras
}

async def run_yolo(camera_id: str):
    loop = asyncio.get_running_loop()
    logger.info(f"[YOLO] Worker started for {camera_id}")

    while True:
        state = camera_state.get(camera_id)
        if state is None:
            await asyncio.sleep(0.1)
            continue

        # ---------------------------------------------------------------
        # Buffering note (mirrors threads.py):
        # The FrameReader daemon thread drains the RTSP buffer at full
        # camera FPS.  camera_state[camera_id]["frame"] is always the
        # *latest* frame — never a stale/buffered one.  We simply read
        # whatever the thread last wrote; no extra draining needed here.
        # ---------------------------------------------------------------
        frame = state["frame"]

        if frame is None:
            # FrameReader hasn't decoded its first frame yet
            await asyncio.sleep(0.1)
            continue

        # Run YOLO in a thread-pool executor — it's a blocking C call
        results = await loop.run_in_executor(
            None,
            lambda: model.track(
                frame,
                persist=True,   # keeps track IDs consistent across frames
                imgsz=640,
                verbose=False,
            )
        )

        events = []
        for box in results[0].boxes:
            label    = model.names[int(box.cls[0])]
            conf     = float(box.conf[0])

            # track() gives each object a persistent ID across frames
            track_id = int(box.id[0]) if box.id is not None else None

            if conf > 0.5:
                events.append({
                    "camera_id":  camera_id,
                    "track_id":   track_id,   # same person = same ID across frames
                    "label":      label,
                    "confidence": round(conf, 2),
                    "severity":   "P1",
                    "ts":         time.time(),
                })

        if events:
            for e in events:
                logger.info(
                    f"[YOLO] [{e['camera_id']}] "
                    f"track_id={e['track_id']} | "
                    f"{e['label']} | "
                    f"conf={e['confidence']} | "
                    f"severity={e['severity']}"
                )
            try:
                alert_queues[camera_id].put_nowait(events)
            except asyncio.QueueFull:
                pass  # drop oldest if queue is full; we only care about latest alerts

        await asyncio.sleep(0.2)  # 5 FPS inference rate


async def start_all_workers():
    for cam_id in alert_queues:
        asyncio.create_task(run_yolo(cam_id))