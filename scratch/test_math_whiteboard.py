import asyncio
import json
import websockets
import sys

async def run_test():
    uri = "ws://localhost:8001"
    print(f"Connecting to WebSocket at {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            # Send RAISE_HAND event asking about integrals
            payload = {
                "action": "RAISE_HAND",
                "question": "Can you explain integrals to me?",
                "video_id": "vid_calculus_01",
                "chapter_id": "calculus_derivatives",
                "timestamp": "01:23",
                "mode": "voice"
            }
            print("Sending RAISE_HAND payload...")
            await websocket.send(json.dumps(payload))
            
            # Wait for response payload
            print("Awaiting response...")
            for _ in range(5):
                response = await websocket.recv()
                data = json.loads(response)
                print(f"Received WS response action: {data.get('action') or data.get('a2ui_payload', {}).get('action')}")
                if "a2ui_payload" in data:
                    a2ui = data["a2ui_payload"]
                    action = a2ui.get("action")
                    if action == "SOCRATIC_HINT":
                        socratic_text = a2ui["data"]["socratic_text"]
                        print(f"SUCCESS: Received SOCRATIC_HINT!")
                        print(f"Socratic Text Preview:\n{socratic_text[:200]}...")
                        sys.exit(0)
            print("FAILURE: Did not receive SOCRATIC_HINT")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_test())
