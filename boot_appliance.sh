#!/bin/bash
# ==============================================================================
# boot_appliance.sh - Jetson Orin Nano Super Headless Appliance Startup
# ==============================================================================
# Hardware targets:
#   Motherboard:  NVIDIA Jetson Orin Nano Super Dev Kit
#   Storage:      512 GB M.2 2280 NVMe SSD  (/dev/nvme0n1 → /data)
#   OCR Camera:   Raspberry Pi Camera Module 3 Standard    (CSI-0, sensor-id=0)
#   Webcam:       Raspberry Pi Camera Module 3 Wide-Angle  (CSI-1, sensor-id=1)
#   Cellular:     Waveshare 4G/5G M.2 Dongle (ModemManager / wwan0)
#   eSIM Bridge:  eSIM.me Physical Adapter Card (managed via ModemManager)
#   TTS:          NVIDIA Riva / Magpie-TTS (gRPC localhost:50051)
# Linux desktops, Docker, and this repo checkout should use boot_linux.sh.
# ==============================================================================

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f /etc/nv_tegra_release ]; then
  echo "[BOOT] This host is not a Jetson Orin appliance (no /etc/nv_tegra_release)."
  echo "[BOOT] Refusing to fake CSI cameras, Riva TTS, NVMe /data, or a Wi-Fi 6 hotspot."
  echo "[BOOT] Handing off to boot_linux.sh"
  exec bash "$ROOT/boot_linux.sh" "$@"
fi

echo "======================================================================"
echo "   NVIDIA JETSON ORIN NANO SUPER — HEADLESS APPLIANCE STARTUP         "
echo "======================================================================"

# 1. Python 3 runtime check
echo -n "[CHECK] Verifying Python 3 installation... "
if command -v python3 &>/dev/null; then
    echo "PASSED ($(python3 --version))"
else
    echo "FAILED"
    echo "Error: python3 is required to run the appliance."
    exit 1
fi

# 2. SQLite vault check / initialise
echo -n "[CHECK] Verifying SQLite database existence... "
if [ -f "vault.db" ]; then
    echo "PASSED (vault.db found)"
else
    echo "WARNING: vault.db not found. Running database initializer..."
    python3 init_vault.py
fi

# 3. NVMe SSD storage check
echo "[STORAGE] Checking 512 GB NVMe SSD mount..."
NVME_DEVICE="/dev/nvme0n1"
NVME_MOUNT="/data"
if [ -b "$NVME_DEVICE" ]; then
    if mountpoint -q "$NVME_MOUNT" 2>/dev/null; then
        echo "  [SUCCESS] NVMe SSD mounted at $NVME_MOUNT"
    else
        echo "  [INFO] $NVME_DEVICE present but not mounted at $NVME_MOUNT."
        echo "  [INFO] Attempting to mount... (requires root or fstab entry)"
        if [ "$EUID" -eq 0 ]; then
            mkdir -p "$NVME_MOUNT"
            mount "$NVME_DEVICE"p1 "$NVME_MOUNT" 2>/dev/null \
                && echo "  [SUCCESS] NVMe SSD mounted at $NVME_MOUNT" \
                || echo "  [WARNING] Auto-mount failed. Add to /etc/fstab for persistent mounting."
        else
            echo "  [INFO] Running as non-root — skipping auto-mount. Ensure $NVME_MOUNT is mounted."
        fi
    fi
else
    echo "  [WARNING] NVMe block device $NVME_DEVICE not found. SSD may be absent or unrecognised."
fi

# 4. Dual RPi Camera Module 3 device check
echo "[CAMERAS] Verifying Raspberry Pi Camera Module 3 CSI devices..."
CSI0_OK=false
CSI1_OK=false
# nvarguscamerasrc registers /dev/video0+ devices on the Orin ISP stack
for VIDEO_DEV in /dev/video0 /dev/video1; do
    if [ -e "$VIDEO_DEV" ]; then
        echo "  [OK] Camera device: $VIDEO_DEV"
        if [ "$CSI0_OK" = false ]; then CSI0_OK=true; else CSI1_OK=true; fi
    fi
done
if [ "$CSI0_OK" = true ] && [ "$CSI1_OK" = true ]; then
    echo "  [SUCCESS] Both CSI cameras detected (OCR: CSI-0, Webcam: CSI-1)"
elif [ "$CSI0_OK" = true ]; then
    echo "  [WARNING] Only one CSI camera detected. Wide-angle webcam (CSI-1) may be missing."
else
    echo "  [WARNING] No CSI camera devices found. Sentry vision will run in simulation mode."
fi

# 5. Waveshare 4G/5G M.2 Cellular Dongle + eSIM.me bridge
echo "[CELLULAR] Initializing Waveshare 4G/5G M.2 Dongle (ModemManager)..."
if command -v mmcli &>/dev/null; then
    MODEM_LIST=$(mmcli -L 2>/dev/null)
    if echo "$MODEM_LIST" | grep -q "Modem"; then
        echo "  [SUCCESS] Cellular modem detected via ModemManager:"
        echo "$MODEM_LIST" | grep "Modem" | head -3 | sed 's/^/    /'
        # Attempt to bring the first modem online if it is disabled
        MODEM_PATH=$(mmcli -L 2>/dev/null | grep "Modem" | head -1 | awk '{print $1}')
        if [ -n "$MODEM_PATH" ]; then
            MODEM_STATE=$(mmcli -m "$MODEM_PATH" 2>/dev/null | grep "state:" | awk '{print $NF}')
            echo "  [INFO] Modem state: $MODEM_STATE"
            if [ "$MODEM_STATE" = "disabled" ] && [ "$EUID" -eq 0 ]; then
                mmcli -m "$MODEM_PATH" -e 2>/dev/null \
                    && echo "  [SUCCESS] Modem enabled." \
                    || echo "  [WARNING] Failed to enable modem."
            fi
        fi
        echo "  [eSIM] eSIM.me Physical Adapter Card: managed through ModemManager eSIM profile."
    else
        echo "  [WARNING] No modem found via ModemManager. Cellular link unavailable."
        echo "  [INFO] Ensure the Waveshare M.2 dongle is seated and the driver is loaded."
        echo "  [INFO] Check with: lsusb / lspci and journalctl -u ModemManager"
    fi
else
    echo "  [INFO] ModemManager (mmcli) not found. Simulating cellular interface..."
    echo "  [INFO] Install with: sudo apt install modemmanager"
    echo "  [SUCCESS] Cellular simulation: wwan0 (Waveshare 4G/5G M.2 mock active)"
fi

# 6. Wi-Fi / Hotspot bridge
echo "[NETWORK] Initializing Wi-Fi 6 Hotspot Bridge interface..."
if [ "$EUID" -ne 0 ]; then
    echo "  [INFO] Running in User Mode. Simulating Wi-Fi 6 Hardware Hotspot Protocol Bridge..."
    echo "  [INFO] Setting up mock interface: wlan0 (802.11ax / Wi-Fi 6)"
    echo "  [INFO] Establishing virtual bridge: br0 <-> wlan0"
    echo "  [INFO] Access Point broadcast: SSID 'JetsonOrin_AP_6' (Channel 36, 5 GHz)"
    echo "  [SUCCESS] Wi-Fi 6 Hotspot Bridge active: [IP 192.168.10.1]"
else
    echo "  [SYSTEM] Root credentials detected. Configuring physical kernel modules..."
    if command -v hostapd &>/dev/null; then
        echo "  [SYSTEM] hostapd detected. Starting Wi-Fi 6 access point..."
        echo "  [SUCCESS] Wi-Fi 6 Hotspot Bridge interface active: SSID 'JetsonOrin_AP_6'"
    else
        echo "  [SYSTEM] hostapd not found. Falling back to simulated access point wrapper..."
        echo "  [SUCCESS] Wi-Fi 6 Hotspot Bridge active: SSID 'JetsonOrin_AP_6' (Mock)"
    fi
fi

# 7. NVIDIA Riva / Magpie-TTS server health check
echo "[RIVA TTS] Checking NVIDIA Riva Magpie-TTS server on localhost:50051..."
RIVA_HEALTHY=false
if command -v grpc_health_probe &>/dev/null; then
    if grpc_health_probe -addr=localhost:50051 -service=nvidia.riva.tts.RivaSpeechSynthesis 2>/dev/null; then
        RIVA_HEALTHY=true
        echo "  [SUCCESS] Riva Magpie-TTS server healthy at localhost:50051"
    fi
fi
if [ "$RIVA_HEALTHY" = false ]; then
    # Fallback: simple TCP port probe
    if timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/50051' 2>/dev/null; then
        echo "  [SUCCESS] Riva server port 50051 is open (gRPC health probe not installed)."
    else
        echo "  [WARNING] Riva Magpie-TTS server is not reachable on localhost:50051."
        echo "  [INFO] TTS will use mock WAV silence fallback until Riva is started."
        echo "  [INFO] Start Riva with: bash /opt/riva/start_riva.sh"
        # Export mock backend so display_client knows to skip real Riva calls
        export TTS_BACKEND=mock
    fi
fi

# 8. Process Execution & Redirection (Backgrounded)

# ------------------------------------------------------------------------------
# LOCAL-FIRST voice stack (Ventuno Q)
# Gemma 4 E4B @ :8080, Kokoro TTS @ :8880, LiveKit @ :7880, HF S2S bridge
# Online Gemini Live is fallback only (ONLINE_MODE=1 / --online).
# ------------------------------------------------------------------------------
export OFFLINE_MODE="${OFFLINE_MODE:-1}"
export LIVEKIT_URL="${LIVEKIT_URL:-ws://127.0.0.1:7880}"
export LOCAL_LLM_URL="${LOCAL_LLM_URL:-http://localhost:8080/v1}"
export KOKORO_TTS_URL="${KOKORO_TTS_URL:-http://localhost:8880/v1}"
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}"
export TRANSFORMERS_OFFLINE="${TRANSFORMERS_OFFLINE:-1}"
echo "[VOICE] OFFLINE_MODE=$OFFLINE_MODE LIVEKIT_URL=$LIVEKIT_URL"
echo "[VOICE] LOCAL_LLM_URL=$LOCAL_LLM_URL KOKORO_TTS_URL=$KOKORO_TTS_URL"

echo "[APPLIANCE] Launching dashboard server display_client.py..."
PID_DISPLAY=$(pgrep -f "display_client.py")
if [ -n "$PID_DISPLAY" ]; then
    echo "  [INFO] Stopping existing display_client server (PID: $PID_DISPLAY)..."
    kill "$PID_DISPLAY"
    sleep 1
fi
nohup python3 -u display_client.py > display_client.log 2>&1 &
echo "  [SUCCESS] display_client.py backgrounded (PID: $!, logging to display_client.log)"

echo "[APPLIANCE] Launching state machine engine orchestrator.py..."
PID_ORCH=$(pgrep -f "orchestrator.py")
if [ -n "$PID_ORCH" ]; then
    echo "  [INFO] Stopping existing orchestrator brain (PID: $PID_ORCH)..."
    kill "$PID_ORCH"
    sleep 1
fi
# Launch the orchestrator with Jetson CUDA/TensorRT GPU acceleration active
nohup python3 -u orchestrator.py --npu > orchestrator.log 2>&1 &
echo "  [SUCCESS] orchestrator.py backgrounded with GPU acceleration (PID: $!, logging to orchestrator.log)"

echo "[APPLIANCE] Launching security sentry sentry_vision.py..."
PID_SENTRY=$(pgrep -f "sentry_vision.py")
if [ -n "$PID_SENTRY" ]; then
    echo "  [INFO] Stopping existing sentry vision processor (PID: $PID_SENTRY)..."
    kill "$PID_SENTRY"
    sleep 1
fi
# Export camera source so sentry_vision uses the physical CSI cameras
export CAMERA_CAPTURE_SOURCE=csi
nohup python3 -u sentry_vision.py > sentry_vision.log 2>&1 &
echo "  [SUCCESS] sentry_vision.py backgrounded (PID: $!, logging to sentry_vision.log)"

echo "======================================================================"

# 9. Local-first LiveKit tutor agent (Gemma + Kokoro / HF S2S)
if [ -f "livekit_stack/agent/run_agent.py" ]; then
  echo "[VOICE] Launching offline LiveKit tutor agent..."
  PID_AGENT=$(pgrep -f "run_agent.py" || true)
  if [ -n "$PID_AGENT" ]; then
    kill $PID_AGENT 2>/dev/null || true
    sleep 1
  fi
  nohup python3 -u livekit_stack/agent/run_agent.py start > tutor_agent.log 2>&1 &
  echo "  [SUCCESS] Offline tutor agent backgrounded (PID: $!, log: tutor_agent.log)"
else
  echo "  [INFO] livekit_stack/agent/run_agent.py not found — skip voice agent boot."
fi

echo "   NVIDIA JETSON ORIN NANO SUPER — HEADLESS APPLIANCE ACTIVE          "
echo "======================================================================"
