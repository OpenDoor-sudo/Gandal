"""OpenAI-compatible proxy. Gemma 4 E4B first, then gemini-3.8-flash.

OpenMAIC is pointed at this process with OPENAI_BASE_URL. The player never
calls open.maic.chat. If neither engine is up, the completion says so.
"""

import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from gandal_classroom.hybrid import complete, docker_hint, unavailable_message
from gandal_space.agent_engine import local_llm_model

CJK = re.compile(r"[\u3400-\u9fff]")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def _send(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0].rstrip("/").endswith("/models"):
            self._send(200, {"object": "list", "data": [{"id": local_llm_model(), "object": "model"}]})
            return
        self._send(404, {"error": "Unknown proxy route."})

    def do_POST(self):
        if not self.path.split("?")[0].rstrip("/").endswith("/chat/completions"):
            self._send(404, {"error": "Unknown proxy route."})
            return
        length = int(self.headers.get("Content-Length", 0) or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            data = {}
        messages = data.get("messages") if isinstance(data, dict) else []
        system_parts = []
        user_parts = []
        for message in messages or []:
            if not isinstance(message, dict):
                continue
            content = message.get("content") or ""
            if isinstance(content, list):
                content = " ".join(
                    str(part.get("text") or "") for part in content if isinstance(part, dict)
                )
            role = message.get("role") or "user"
            if role == "system":
                system_parts.append(str(content))
            else:
                user_parts.append(f"{role}: {content}")
        system = "\n".join(system_parts) or (
            "Reply in English or French only. Never write Chinese characters."
        )
        user = "\n".join(user_parts) or "Continue the classroom."
        text, _provider, engine = complete(system, user)
        if text and CJK.search(text):
            cleaned = CJK.sub("", text).strip()
            text = cleaned if len(cleaned) >= 8 else (
                "The model did not answer in English or French. "
                "Gandho will teach this lesson in the selected language."
            )
        if not text:
            text = unavailable_message() + docker_hint()
            engine = "unavailable"
        self._send(200, {
            "id": "gandal-classroom",
            "object": "chat.completion",
            "model": local_llm_model(),
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": text},
                "finish_reason": "stop",
            }],
            "gandal_engine": engine,
        })


def serve(port: int = 8099) -> None:
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"[GANDAL CLASSROOM] model proxy on http://127.0.0.1:{port}/v1", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    serve(int(__import__("os").environ.get("GANDAL_CLASSROOM_PROXY_PORT", "8099")))
