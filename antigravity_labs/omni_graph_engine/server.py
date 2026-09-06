import os
import sys
import json
import base64
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8085
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_google_api_key():
    key = os.environ.get('GOOGLE_API_KEY')
    if key and key != 'your_google_api_key_here':
        return key
    
    env_paths = [
        os.path.join(BASE_DIR, '..', '..', '.env'),
        os.path.join(BASE_DIR, '.env'),
        'c:/Users/lalyb/Desktop/ventuno_ai_testbed/.env'
    ]
    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip().startswith('GOOGLE_API_KEY='):
                            val = line.strip().split('=', 1)[1].strip().strip('"\'')
                            if val and val != 'your_google_api_key_here':
                                return val
            except Exception:
                pass
    return None

def extract_math_with_gemini(image_base64):
    google_key = get_google_api_key()
    if not google_key:
        raise ValueError('No GOOGLE_API_KEY available')
    
    mime = 'image/png'
    if ',' in image_base64:
        header, image_base64 = image_base64.split(',', 1)
        if 'jpeg' in header or 'jpg' in header:
            mime = 'image/jpeg'
        elif 'webp' in header:
            mime = 'image/webp'
        else:
            mime = 'image/png'

    prompt = """You are an expert mathematical OCR and vision parser for an interactive STEM graphing engine.
Examine this image containing a mathematical problem or equation.
Extract ALL mathematical equations, functions, or inequalities that need to be plotted.
CRITICAL INSTRUCTIONS:
- If there are multiple equations or inequalities (e.g. "y <= x + 1" and "y >= 2x + 1", or joined by "and", or listed on separate lines), you MUST extract ALL of them separated by a comma: "y <= x + 1, y >= 2x + 1".
- Do not omit any equation or inequality.
- Do not include instructions like "Graph the inequalities", labels like "PROBLEM 12", or question numbers.
- Use standard math syntax: "^" for power (e.g. "x^2"), "<=" for <=, ">=" for >=, "sin(x)", "cos(x)", "sqrt(x)".
- If it is a circle or conic equation (e.g. "x^2 + y^2 = 25"), keep standard form.
- Return ONLY the clean mathematical formula string, nothing else. No markdown, no quotes, no explanations."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={google_key}"
    data = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime, "data": image_base64}}
            ]
        }],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 1000
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        text = result['candidates'][0]['content']['parts'][0]['text'].strip()
        text = text.replace('```math', '').replace('```', '').strip()
        return text

def extract_math_with_local_gemma(image_base64):
    local_url = os.environ.get("LOCAL_LLM_URL", "http://localhost:8080/v1")
    data_url = image_base64 if image_base64.startswith("data:") else f"data:image/png;base64,{image_base64}"
    
    prompt = """You are an expert mathematical OCR and vision parser for an interactive STEM graphing engine.
Examine this image containing a mathematical problem or equation.
Extract ALL mathematical equations, functions, or inequalities that need to be plotted.
CRITICAL INSTRUCTIONS:
- If there are multiple equations or inequalities (e.g. "y <= x + 1" and "y >= 2x + 1", or joined by "and", or listed on separate lines), you MUST extract ALL of them separated by a comma: "y <= x + 1, y >= 2x + 1".
- Do not omit any equation or inequality.
- Do not include instructions like "Graph the inequalities", labels like "PROBLEM 12", or question numbers.
- Use standard math syntax: "^" for power (e.g. "x^2"), "<=" for <=, ">=" for >=, "sin(x)", "cos(x)", "sqrt(x)".
- If it is a circle or conic equation (e.g. "x^2 + y^2 = 25"), keep standard form.
- Return ONLY the clean mathematical formula string, nothing else. No markdown, no quotes, no explanations."""

    payload = {
        "model": os.environ.get("LOCAL_MODEL_NAME", "gemma-4-e4b"),
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
            }
        ],
        "temperature": 0.0,
        "max_tokens": 150
    }
    
    req = urllib.request.Request(
        f"{local_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        text = result["choices"][0]["message"]["content"].strip()
        return text.replace("```math", "").replace("```", "").strip()

def extract_math(image_base64):
    # Tier 1: Local 100% Offline Gemma 4 E4B (Hexagon NPU / local endpoint on port 8080)
    try:
        print("[VISION OCR] Checking local offline Gemma 4 E4B server (http://localhost:8080/v1)...")
        res = extract_math_with_local_gemma(image_base64)
        if res and len(res) >= 2:
            print(f"[VISION OCR] Extracted with local Gemma 4 E4B: {res}")
            return res, "gemma-4-e4b (offline)"
    except Exception as local_err:
        print(f"[VISION OCR] Local Gemma 4 E4B offline/not active ({local_err}). Trying cloud fallback...")

    # Tier 2: Cloud Google Gemini 2.5 Flash Vision (if key available)
    try:
        print("[VISION OCR] Querying Gemini Vision AI...")
        res = extract_math_with_gemini(image_base64)
        if res and len(res) >= 2:
            print(f"[VISION OCR] Extracted with Gemini Vision: {res}")
            return res, "gemini-vision (cloud)"
    except Exception as cloud_err:
        print(f"[VISION OCR] Cloud Gemini Vision failed: {cloud_err}")

    raise RuntimeError("No vision engine available (Local Gemma 4 E4B or Cloud Gemini)")

class OmniServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/v1/math/vision_ocr':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length)
                payload = json.loads(body.decode('utf-8'))
                image_base64 = payload.get('image_base64', '')

                if not image_base64:
                    self._send_json({'success': False, 'error': 'No image data provided'}, 400)
                    return

                equation, engine_source = extract_math(image_base64)
                print(f'[VISION OCR] Successfully extracted: {equation} via [{engine_source}]')
                self._send_json({'success': True, 'equation': equation, 'source': engine_source})
            except Exception as e:
                print(f'[VISION OCR ERROR] {e}')
                self._send_json({'success': False, 'error': str(e)}, 500)
        else:
            self.send_error(404, 'Endpoint not found')

    def _send_json(self, data, status=200):
        resp_bytes = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(resp_bytes)))
        self.end_headers()
        self.wfile.write(resp_bytes)

def run():
    server = HTTPServer(('0.0.0.0', PORT), OmniServerHandler)
    print(f'OmniGraphEngine Server running at http://localhost:{PORT} (Serving {BASE_DIR})')
    server.serve_forever()

if __name__ == '__main__':
    run()
