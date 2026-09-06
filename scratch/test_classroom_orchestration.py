import asyncio
import json
import websockets
import sys
import os
import threading
import time

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

async def recv_until_match(ws, key, expected_val, timeout=5.0):
    start = asyncio.get_event_loop().time()
    while True:
        try:
            remaining = timeout - (asyncio.get_event_loop().time() - start)
            if remaining <= 0:
                raise TimeoutError(f"Timed out waiting for {key} == {expected_val}")
            msg = await asyncio.wait_for(ws.recv(), timeout=remaining)
            data = json.loads(msg)
            print(f"[RECV] Received payload: {data}")
            if data.get(key) == expected_val:
                return data
        except json.JSONDecodeError:
            pass

async def run_classroom_test():
    print("=== STARTING AUTOMATED CLASSROOM ORCHESTRATION VERIFICATION ===")
    
    uri_a = "ws://localhost:8001?student_id=STU-001"
    uri_b = "ws://localhost:8001?student_id=STU-002"
    
    # Wait for socket server if connecting
    connected = False
    for retry in range(10):
        try:
            ws_a = await websockets.connect(uri_a)
            ws_b = await websockets.connect(uri_b)
            connected = True
            break
        except Exception as err:
            print(f"[TEST WAIT] Server port 8001 not ready yet ({err})... retrying in 0.5s")
            await asyncio.sleep(0.5)

    if not connected:
        print("[TEST ERROR] Could not connect to server on port 8001")
        sys.exit(1)

    print("[TEST SUCCESS] Student A and Student B connected via WebSockets.")
    
    # 1. Student A toggles Mic ON (START_STREAM)
    print("[TEST] Student A sending START_STREAM...")
    await ws_a.send(json.dumps({"action": "START_STREAM", "student_id": "STU-001"}))
    
    # 2. Verify Student B receives LOCKED status
    data_locked = await recv_until_match(ws_b, "status", "LOCKED")
    assert data_locked.get("speaker_id") == "STU-001"
    print("[SUCCESS] Student B correctly received LOCKED status from Student A mic start!")

    # 3. Student A toggles Mic OFF (STOP_STREAM)
    print("[TEST] Student A sending STOP_STREAM...")
    await ws_a.send(json.dumps({"action": "STOP_STREAM", "student_id": "STU-001"}))

    # 4. Verify Student B receives UNLOCKED status
    data_unlocked = await recv_until_match(ws_b, "status", "UNLOCKED")
    print("[SUCCESS] Student B correctly received UNLOCKED status!")

    # 5. Simulate LESSON_COMPLETE master quiz broadcast from server
    print("[TEST] Broadcasting LESSON_COMPLETE master quiz payload...")
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
    print("[SUCCESS] LESSON_COMPLETE broadcast received by Student B!")

    # 7. Student B submits evaluation answer
    print("[TEST] Student B submitting quiz answers...")
    await ws_b.send(json.dumps({
        "action": "SUBMIT_QUIZ",
        "student_id": "STU-002",
        "answers": {"0": "0"}
    }))

    # 8. Verify Student B receives QUIZ_RESULT
    data_result = await recv_until_match(ws_b, "action", "QUIZ_RESULT")
    print(f"[SUCCESS] Quiz result received by Student B: {data_result}")

    await ws_a.close()
    await ws_b.close()
    print("\n=== ALL CLASSROOM ORCHESTRATION TESTS PASSED CLEANLY ===")

if __name__ == "__main__":
    try:
        asyncio.run(run_classroom_test())
    except Exception as e:
        print(f"[TEST FAILED] {e}")
        sys.exit(1)
