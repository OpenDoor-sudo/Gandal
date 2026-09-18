"""
server.py - Standalone FastAPI Server & WebSocket Layer for Gandal Space
Exposes:
  - WebSocket: /ws/classroom (for streaming chat and audio byte arrays)
  - REST: /api/gandal_space/ask
  - REST: /api/gandal_space/status
  - REST: /api/gandal_space/eval_audio
"""

import os
import sys
import json
import base64
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

# Add parent directory to path to ensure imports work cleanly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from gandal_space.agent_engine import default_engine

app = FastAPI(
    title="Gandal Space AI - Universal K-12+ Appliance Server",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    prompt: str

class AudioEvalRequest(BaseModel):
    target_letter: str
    expected_phoneme: str
    audio_base64: str = ""
    student_transcript: str = ""

@app.get("/api/gandal_space/status")
async def get_status():
    """Return status of local Ollama Gemma 4 edge and cloud Gemini fallback."""
    return default_engine.get_system_status()

@app.post("/api/gandal_space/ask")
async def handle_ask(req: QueryRequest):
    """Process question across K-12 and return A2UI JSON payload."""
    result = default_engine.process_query(req.prompt)
    return JSONResponse(content=result)

@app.post("/api/gandal_space/eval_audio")
async def handle_eval_audio(req: AudioEvalRequest):
    """Evaluate student's spoken audio against target letter and expected phoneme."""
    result = default_engine.evaluate_pronunciation(
        target_letter=req.target_letter,
        expected_phoneme=req.expected_phoneme,
        student_transcript=req.student_transcript,
        audio_base64=req.audio_base64
    )
    return JSONResponse(content=result)

@app.websocket("/ws/classroom")
async def websocket_classroom_endpoint(websocket: WebSocket):
    """
    Bidirectional WebSocket endpoint for the classroom:
    Accepts text queries or binary audio payloads, streams A2UI JSON back to client.
    """
    await websocket.accept()
    print("[GANDAL SPACE WS] Client connected to /ws/classroom")
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            msg_type = data.get("type", "query")

            if msg_type in ["query", "ask"]:
                prompt = data.get("prompt", "")
                result = default_engine.process_query(prompt)
                await websocket.send_text(json.dumps({
                    "event": "ui_payload",
                    "result": result
                }))

            elif msg_type in ["audio_evaluation", "eval_audio"]:
                letter = data.get("target_letter", "A")
                phoneme = data.get("expected_phoneme", "/eɪ/")
                audio_b64 = data.get("audio_base64", "")
                eval_res = default_engine.evaluate_pronunciation(
                    target_letter=letter,
                    expected_phoneme=phoneme,
                    audio_base64=audio_b64
                )
                await websocket.send_text(json.dumps({
                    "event": "audio_feedback",
                    "result": eval_res
                }))

    except WebSocketDisconnect:
        print("[GANDAL SPACE WS] Client disconnected from /ws/classroom")
    except Exception as e:
        print(f"[GANDAL SPACE WS] Error: {e}")

# Mount static files if present
if os.path.exists(CURRENT_DIR):
    app.mount("/static/gandal_space", StaticFiles(directory=CURRENT_DIR), name="gandal_space_static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("GANDAL_SPACE_PORT", 8008))
    print(f"=== Starting Gandal Space FastAPI Server on http://0.0.0.0:{port} ===")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
