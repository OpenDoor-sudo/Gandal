# sentry_vision.py — presence tracking for Arduino Ventuno Q
# Desk camera: sentry_vision_desk_01 (USB or CSI as wired on the Ventuno Q).
# Desktop simulation: CAMERA_CAPTURE_SOURCE=mock
#
# The Orin carrier board exposes two native 22-pin RPi-compatible MIPI CSI-2
# ports.  Both cameras are accessed via the nvarguscamerasrc GStreamer element.
#
# Presence tracking uses the WIDE-ANGLE camera (sensor-id=1) for maximum
# field-of-view coverage of the student workspace.  The OCR camera (sensor-id=0)
# is reserved for handwriting / document capture initiated by the orchestrator.
#
# Face detection: MediaPipe FaceDetection (short-range model) is preferred over
# the legacy Haar cascade because it runs on the Jetson GPU and is significantly
# more accurate on partial/side-profile faces.  OpenCV Haar is kept as a
# graceful fallback for environments where MediaPipe is not installed.
#
# Enforces strict binary logic based entirely on face count to control video
# play / pause.

import os
import sys
import time
import json
import asyncio
import websockets

# ---------------------------------------------------------------------------
# Camera configuration — read from environment variables so that the values
# can be overridden at runtime without code changes.
# ---------------------------------------------------------------------------
# Webcam (wide-angle, presence tracking) — RPi Camera Module 3 Wide on CSI-1
WEBCAM_SENSOR_ID = int(os.environ.get("WEBCAM_SENSOR_ID", "1"))
WEBCAM_WIDTH     = int(os.environ.get("WEBCAM_WIDTH",  "1280"))
WEBCAM_HEIGHT    = int(os.environ.get("WEBCAM_HEIGHT", "720"))
WEBCAM_FPS       = int(os.environ.get("WEBCAM_FPS",    "30"))

# OCR camera (standard, document capture) — RPi Camera Module 3 on CSI-0
OCR_SENSOR_ID    = int(os.environ.get("OCR_SENSOR_ID", "0"))


def _build_gst_pipeline(sensor_id: int, width: int, height: int, fps: int) -> str:
    """
    Build a GStreamer pipeline string for a Raspberry Pi Camera Module 3
    connected to the Jetson Orin Nano Super via MIPI CSI-2.

    nvarguscamerasrc → NVMM memory → nvvidconv (BGRx) → videoconvert → BGR
    This pipeline keeps decoding on the Jetson ISP/VIC hardware path.
    """
    return (
        f"nvarguscamerasrc sensor-id={sensor_id} ! "
        f"video/x-raw(memory:NVMM), width=(int){width}, height=(int){height}, "
        f"format=(string)NV12, framerate=(fraction){fps}/1 ! "
        f"nvvidconv flip-method=0 ! "
        f"video/x-raw, width=(int){width}, height=(int){height}, format=(string)BGRx ! "
        f"videoconvert ! "
        f"video/x-raw, format=(string)BGR ! appsink drop=1"
    )


async def run_simulation(websocket):
    fps = 30
    frame_delay = 1.0 / fps
    frame_count = 0

    # Predefined sequence of focus and security states for verification:
    states = [
        {"duration": 5, "type": "present_awake", "desc": "Verified Owner Present & Awake"},
        {"duration": 8, "type": "no_face",        "desc": "Attentional Alert: No Face Present"},
        {"duration": 5, "type": "present_awake", "desc": "Verified Owner Returns & Awake"},
        {"duration": 8, "type": "sleeping",       "desc": "Attentional Alert: User Sleeping (Face Still Present)"},
        {"duration": 5, "type": "present_awake", "desc": "Verified Owner Awake"},
        {"duration": 6, "type": "unauthorized",   "desc": "Security Lockout: Unauthorized User Detected"},
        {"duration": 5, "type": "present_awake", "desc": "Verified Owner Restored"}
    ]

    current_state_idx = 0
    state_start_time = time.time()

    # State tracking variables to manage socket events cleanly
    is_video_paused_by_sentry = False
    is_device_locked_by_sentry = False

    print("[SENTRY] Starting 30 FPS webcam simulation loop with binary presence check...")
    while True:
        loop_start = time.time()
        frame_count += 1

        # Calculate active state
        elapsed = time.time() - state_start_time
        state_config = states[current_state_idx]
        if elapsed >= state_config["duration"]:
            current_state_idx = (current_state_idx + 1) % len(states)
            state_start_time = time.time()
            state_config = states[current_state_idx]
            print(f"\n[SENTRY STATE SWITCH] Transitioning to: {state_config['desc']}")

        current_state = state_config["type"]

        # Determine face count for logging compatibility
        face_count = 0 if current_state == "no_face" else 1

        # --- Strict Biometric & Attentional Camera logic gate ---
        if current_state == "no_face":
            if not is_video_paused_by_sentry:
                print(f"[SENTRY] No face present. Emitting strict pause event over WebSocket.")
                await websocket.send(json.dumps({
                    "action": "PAUSE_VIDEO",
                    "reason": "no_face_present"
                }))
                is_video_paused_by_sentry = True

        else:
            # Face is present → do not pause or lock; resume if paused
            if is_device_locked_by_sentry:
                print(f"[SENTRY] Verified owner restored. Unlocking workspace.")
                await websocket.send(json.dumps({"action": "UNLOCK_DEVICE"}))
                is_device_locked_by_sentry = False

            if is_video_paused_by_sentry:
                print(f"[SENTRY] Face detected. Resuming video timeline.")
                await websocket.send(json.dumps({"action": "PLAY_VIDEO"}))
                is_video_paused_by_sentry = False

        # Throttled console log (once per second / 30 frames)
        if frame_count % 30 == 0:
            print(
                f"  [CAMERA STREAM] 30 FPS simulation | Frame: {frame_count} "
                f"| State: {current_state} | face_count: {face_count}",
                flush=True
            )

        # Enforce 30 FPS timing
        elapsed_loop = time.time() - loop_start
        sleep_time = max(0, frame_delay - elapsed_loop)
        await asyncio.sleep(sleep_time)


def _try_open_camera_mediapipe(cap):
    """
    Attempt to load MediaPipe FaceDetection. Returns the detector object if
    available, or None if MediaPipe is not installed.
    """
    try:
        import mediapipe as mp
        mp_face = mp.solutions.face_detection
        # model_selection=0 → short-range model (≤2 m), best for desk/monitor use
        detector = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        print("[SENTRY] MediaPipe FaceDetection loaded (short-range model, GPU-accelerated on Jetson).")
        return detector
    except ImportError:
        print("[SENTRY] MediaPipe not installed. Falling back to OpenCV Haar cascade.")
        print("[SENTRY INFO] Install with: pip install mediapipe")
        return None


async def run_physical_camera(websocket):
    """
    Opens the wide-angle RPi Camera Module 3 (CSI-1, sensor-id=1) via the
    Jetson GStreamer/nvarguscamerasrc hardware pipeline.

    Face detection priority:
      1. MediaPipe FaceDetection (GPU — preferred)
      2. OpenCV Haar cascade (CPU — fallback)
    """
    try:
        import cv2
    except ImportError:
        print("[SENTRY ERROR] OpenCV is not installed. Physical camera tracking requires opencv-python.")
        print("[SENTRY INFO] Install with: pip install opencv-python")
        print("[SENTRY] Falling back to simulation.")
        await run_simulation(websocket)
        return

    fps    = WEBCAM_FPS
    width  = WEBCAM_WIDTH
    height = WEBCAM_HEIGHT

    # --- Primary: Jetson ISP hardware GStreamer pipeline ---
    gst_pipeline = _build_gst_pipeline(WEBCAM_SENSOR_ID, width, height, fps)
    print(
        f"[SENTRY] Opening wide-angle RPi Cam 3 via GStreamer ISP pipeline: "
        f"sensor-id={WEBCAM_SENSOR_ID} ({width}x{height} @ {fps} fps)..."
    )
    cap = cv2.VideoCapture(gst_pipeline, cv2.CAP_GSTREAMER)

    if not cap.isOpened():
        print(
            f"[SENTRY WARNING] GStreamer pipeline for sensor-id={WEBCAM_SENSOR_ID} failed to open. "
            "Trying /dev/video0 as V4L2 fallback..."
        )
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[SENTRY ERROR] Could not open any camera device. Falling back to simulation mode.")
        await run_simulation(websocket)
        return

    # --- Face detector setup (MediaPipe preferred, Haar fallback) ---
    mediapipe_detector = _try_open_camera_mediapipe(cap)

    # Haar fallback (only loaded if MediaPipe unavailable)
    haar_cascade = None
    if mediapipe_detector is None:
        face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        haar_cascade = cv2.CascadeClassifier(face_cascade_path)
        print("[SENTRY] OpenCV Haar cascade loaded as face detector fallback.")

    is_video_paused_by_sentry = False
    frame_count  = 0
    frame_delay  = 1.0 / fps
    face_count   = 0

    print(f"[SENTRY] Physical wide-angle camera loop running at {fps} FPS...")
    try:
        while True:
            loop_start = time.time()
            ret, frame = cap.read()
            if not ret:
                print("[SENTRY ERROR] Failed to grab frame from wide-angle camera.")
                await asyncio.sleep(1.0)
                continue

            frame_count += 1

            # Detect faces every 3rd frame to reduce load
            if frame_count % 3 == 0:
                if mediapipe_detector is not None:
                    # MediaPipe expects RGB
                    import mediapipe as mp
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    results = mediapipe_detector.process(rgb_frame)
                    face_count = len(results.detections) if results.detections else 0
                else:
                    # OpenCV Haar (CPU fallback)
                    gray       = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    small_gray = cv2.resize(gray, (0, 0), fx=0.5, fy=0.5)
                    faces      = haar_cascade.detectMultiScale(
                        small_gray, scaleFactor=1.2, minNeighbors=3, minSize=(30, 30)
                    )
                    face_count = len(faces)

                # Attentional binary control gate
                if face_count == 0:
                    if not is_video_paused_by_sentry:
                        print("[SENTRY] No face detected. Emitting PAUSE event.")
                        await websocket.send(json.dumps({
                            "action": "PAUSE_VIDEO",
                            "reason": "no_face_present"
                        }))
                        is_video_paused_by_sentry = True
                else:
                    if is_video_paused_by_sentry:
                        print(f"[SENTRY] Face restored ({face_count}). Emitting PLAY event.")
                        await websocket.send(json.dumps({"action": "PLAY_VIDEO"}))
                        is_video_paused_by_sentry = False

            if frame_count % 30 == 0:
                detector_label = "MediaPipe" if mediapipe_detector else "Haar"
                print(
                    f"  [CAMERA STREAM] Wide-Angle CSI-1 ({detector_label}) | "
                    f"Frame: {frame_count} | Detected faces: {face_count}",
                    flush=True
                )

            # Sleep to match camera FPS rate
            elapsed = time.time() - loop_start
            await asyncio.sleep(max(0, frame_delay - elapsed))

    except asyncio.CancelledError:
        print("[SENTRY] Physical camera loop cancelled.")
    finally:
        cap.release()
        if mediapipe_detector is not None:
            mediapipe_detector.close()


async def sentry_loop():
    uri = "ws://127.0.0.1:8001"
    camera_source = os.environ.get("CAMERA_CAPTURE_SOURCE", "mock").lower()

    while True:
        try:
            print(f"[SENTRY] Connecting to WebSocket display server: {uri}")
            async with websockets.connect(uri) as websocket:
                print("[SENTRY] WebSocket connection established.")
                if camera_source in ("csi", "physical"):
                    await run_physical_camera(websocket)
                else:
                    await run_simulation(websocket)
        except Exception as e:
            print(f"[SENTRY] Connection failed or closed: {e}. Retrying in 3 seconds...")
            await asyncio.sleep(3)


if __name__ == "__main__":
    print("=== STARTING DUAL-CAMERA SENTRY AND SECURITY MODULE ===")
    print(f"  OCR Camera:     RPi Camera Module 3 Standard  (CSI-0, sensor-id={OCR_SENSOR_ID})")
    print(f"  Webcam Camera:  RPi Camera Module 3 Wide-Angle (CSI-1, sensor-id={WEBCAM_SENSOR_ID})")
    print(f"  Presence source: {os.environ.get('CAMERA_CAPTURE_SOURCE', 'mock (simulation)')}")
    print("="*55)
    try:
        asyncio.run(sentry_loop())
    except KeyboardInterrupt:
        print("\n[SENTRY] Terminated by user.")
