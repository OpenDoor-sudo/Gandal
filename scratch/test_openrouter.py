import os
import sys

# Add root folder to sys.path so we can import orchestrator
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from orchestrator import query_openrouter
from socratic_sentry import STEM_TUTOR_PROMPT

def test_connection():
    print("[TEST] Reading environment variable...")
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        # Try loading from .env
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
        print(f"[TEST] Loading .env from: {env_path}")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.strip() and not line.startswith("#"):
                        parts = line.strip().split("=", 1)
                        if len(parts) == 2:
                            k, v = parts
                            if k.strip() == "OPENROUTER_API_KEY":
                                os.environ["OPENROUTER_API_KEY"] = v.strip().strip('"').strip("'")
                                print("[TEST] Key loaded from .env successfully.")
    
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key or key == "your_openrouter_api_key_here":
        print("[TEST ERROR] OPENROUTER_API_KEY is missing or invalid. Please fill in your OpenRouter API key in .env.")
        return False
        
    print("[TEST] Launching Socratic query to OpenRouter...")
    sys_prompt = STEM_TUTOR_PROMPT
    user_prompt = "Why does period of a pendulum not depend on mass?"
    
    response = query_openrouter(sys_prompt, user_prompt)
    if response:
        print("\n" + "="*50)
        print("SUCCESS! Response from OpenRouter:")
        print(response)
        print("="*50 + "\n")
        return True
    else:
        print("[TEST ERROR] Received empty response from OpenRouter.")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
