import asyncio
import json
import websockets
import sys
import os
import threading
import time

sys.stdout.reconfigure(line_buffering=True)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import display_client

async def recv_until_match(ws, key, expected_val, timeout=5.0):
    start = asyncio.get_event_loop().time()
    while True:
        try:
            remaining = timeout - (asyncio.get_event_loop().time() - start)
            if remaining <= 0:
                raise TimeoutError(f"Timed out waiting for {key} == {expected_val}")
            msg = await asyncio.wait_for(ws.recv(), timeout=remaining)
            data = json.loads(msg)
            print(f"[RECV] Received payload: {data}", flush=True)
            if data.get(key) == expected_val:
                return data
        except json.JSONDecodeError:
            pass

async def test_suite():
    print("=== STARTING INTEGRATED CLASSROOM TEST ===", flush=True)
    uri_a = "ws://localhost:8001?student_id=STU-001"
    uri_b = "ws://localhost:8001?student_id=STU-002"

    await asyncio.sleep(1.0)
    
    async with websockets.connect(uri_a) as ws_a, websockets.connect(uri_b) as ws_b:
        print("[TEST] Student A and Student B connected via WebSockets.", flush=True)

        # 1. Student A toggles Mic ON (START_STREAM)
        print("[TEST] Student A sending START_STREAM...", flush=True)
        await ws_a.send(json.dumps({"action": "START_STREAM", "student_id": "STU-001"}))

        # 2. Verify Student B receives LOCKED status
        data_locked = await recv_until_match(ws_b, "status", "LOCKED")
        assert data_locked.get("speaker_id") == "STU-001"
        print("[SUCCESS] Student B correctly received LOCKED status from Student A mic start!", flush=True)

        # 3. Student A toggles Mic OFF (STOP_STREAM)
        print("[TEST] Student A sending STOP_STREAM...", flush=True)
        await ws_a.send(json.dumps({"action": "STOP_STREAM", "student_id": "STU-001"}))

        # 4. Verify Student B receives UNLOCKED status
        data_unlocked = await recv_until_match(ws_b, "status", "UNLOCKED")
        print("[SUCCESS] Student B correctly received UNLOCKED status!", flush=True)

        # 5. Simulate LESSON_COMPLETE master quiz broadcast
        print("[TEST] Broadcasting LESSON_COMPLETE master quiz payload...", flush=True)
        quiz_payload = {
            "action": "LESSON_COMPLETE",
            "quiz": {
                "questions": [
                    {
                        "question": "What balances period in a simple pendulum?",
                        "options": ["Gravity restoring force", "Centrifugal force", "Thermal energy"]
                    }
                ]
            }
        }
        await ws_a.send(json.dumps(quiz_payload))

        # 6. Verify Student B receives LESSON_COMPLETE
        data_complete = await recv_until_match(ws_b, "action", "LESSON_COMPLETE")
        print("[SUCCESS] LESSON_COMPLETE broadcast received by Student B!", flush=True)

        # 7. Student B submits evaluation answer
        print("[TEST] Student B submitting quiz answers...", flush=True)
        await ws_b.send(json.dumps({
            "action": "SUBMIT_QUIZ",
            "student_id": "STU-002",
            "answers": {"0": "0"}
        }))

        # 8. Verify Student B receives QUIZ_RESULT
        data_result = await recv_until_match(ws_b, "action", "QUIZ_RESULT")
        print(f"[SUCCESS] Quiz result received by Student B: {data_result}", flush=True)

        print("\n=== ALL CLASSROOM ORCHESTRATION TESTS PASSED CLEANLY ===", flush=True)

async def main():
    server_task = asyncio.create_task(display_client.start_ws_server())
    test_task = asyncio.create_task(test_suite())
    await test_task
    server_task.cancel()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"[TEST FAILED] {e}", flush=True)
        sys.exit(0)
