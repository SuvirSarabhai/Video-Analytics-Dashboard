"""
viewer.py — Standalone annotated-frame viewer

Run from the backend/ directory (with .venv active):
    python viewer.py

Connects directly to the MediaMTX RTSP stream, runs YOLO tracking,
and shows the annotated output in an OpenCV window.
Press  Q  to quit.
"""

import cv2
from ultralytics import YOLO

RTSP_URL = "rtsp://localhost:8554/cam1"
WINDOW   = "YOLO Viewer — press Q to quit"

model = YOLO("yolov8n.pt")   # swap with your PPE weights

cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
if not cap.isOpened():
    raise RuntimeError(f"Cannot open stream: {RTSP_URL}\n"
                       "Make sure mediamtx.exe and the FFmpeg publisher are running.")

cv2.namedWindow(WINDOW, cv2.WINDOW_NORMAL)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Stream lost — retrying…")
        cap.open(RTSP_URL, cv2.CAP_FFMPEG)
        continue

    results = model.track(frame, persist=True, imgsz=640, verbose=False)
    annotated = results[0].plot()   # draws boxes + labels + track IDs

    cv2.imshow(WINDOW, annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
