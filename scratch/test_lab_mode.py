# scratch/test_lab_mode.py - Test suite for Mode 3: LAB & Synced Pods
import asyncio
import json
import os
import sys
import websockets

async def run_lab_mode_test():
    print("=== STARTING MODE 3: LAB INTEGRATED TEST ===")
    
    # 1. Connect Student A to WebSocket server
    uri_a = "ws://localhost:8001?student_id=STU-001"
    async with websockets.connect(uri_a) as ws_a:
        print("[TEST] Student A connected to WebSocket server.")
        
        # 2. Student A creates a Synced Pod (POD-101)
        create_pkt = {
            "action": "POD_CREATE",
            "student_ids": ["STU-001"],
            "video_id": "vid_physics_01"
        }
        await ws_a.send(json.dumps(create_pkt))
        res_a = await ws_a.recv()
        data_a = json.loads(res_a)
        print(f"[TEST] Student A created pod response: {data_a}")
        assert data_a.get("action") == "POD_CREATED"
        pod_id = data_a.get("pod_id")
        assert pod_id.startswith("POD-")
        print(f"[SUCCESS] Student A successfully generated pod: {pod_id}")
        
        # 3. Connect Student B to join Student A's Pod
        uri_b = f"ws://localhost:8001?student_id=STU-002&pod_id={pod_id}"
        async with websockets.connect(uri_b) as ws_b:
            print(f"[TEST] Student B connecting to Pod {pod_id}...")
            
            join_pkt = {
                "action": "POD_JOIN",
                "pod_id": pod_id,
                "student_ids": ["STU-002"]
            }
            await ws_b.send(json.dumps(join_pkt))
            
            # Read join broadcast on Student B
            res_join_b = await ws_b.recv()
            data_join_b = json.loads(res_join_b)
            print(f"[TEST] Student B joined pod response: {data_join_b}")
            assert data_join_b.get("action") == "POD_JOINED"
            assert "STU-002" in data_join_b.get("members")
            print("[SUCCESS] Student B joined Pod 101 successfully.")
            
            # 4. Test Synced Pod Media Control (Student A clicks Play)
            media_pkt = {
                "action": "POD_MEDIA_CONTROL",
                "command": "play",
                "current_time": 12.5,
                "pod_id": pod_id,
                "sender": "STU-001"
            }
            await ws_a.send(json.dumps(media_pkt))
            
            # Student B receives synchronized media control command
            res_media_b = await ws_b.recv()
            data_media_b = json.loads(res_media_b)
            print(f"[TEST] Student B received synced media command: {data_media_b}")
            assert data_media_b.get("action") == "POD_MEDIA_CONTROL"
            assert data_media_b.get("command") == "play"
            assert data_media_b.get("current_time") == 12.5
            print("[SUCCESS] Media playback state synchronized from Student A to Student B!")
            
            # 5. Test Group Evaluation & Mastery Credit Mapping
            quiz_pkt = {
                "action": "SUBMIT_LAB_QUIZ",
                "pod_id": pod_id,
                "video_id": "vid_physics_01",
                "score": 100
            }
            await ws_a.send(json.dumps(quiz_pkt))
            
            res_quiz_b = await ws_b.recv()
            data_quiz_b = json.loads(res_quiz_b)
            print(f"[TEST] Student B received pod quiz result: {data_quiz_b}")
            assert data_quiz_b.get("action") == "QUIZ_RESULT"
            assert data_quiz_b.get("score") == 100
            assert "STU-001" in data_quiz_b.get("members")
            assert "STU-002" in data_quiz_b.get("members")
            print("[SUCCESS] Pod quiz evaluation graded and mapped to both STU-001 and STU-002!")
            
    print("\n=== ALL MODE 3 LAB ORCHESTRATION TESTS PASSED CLEANLY ===")

if __name__ == "__main__":
    asyncio.run(run_lab_mode_test())
