FROM python:3.11-slim-bookworm

# Install system packages (ffmpeg is mandatory for LiveKit WebRTC audio codecs and Faster-Whisper)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Launch the LiveKit Agent in start mode
CMD ["python", "tutor_agent.py", "start"]
