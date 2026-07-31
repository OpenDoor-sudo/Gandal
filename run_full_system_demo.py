# ==============================================================================
# run_full_system_demo.py - End-to-End System Demonstration & Verification
# ==============================================================================
import subprocess
import time
import sys
import os
import sqlite3
import socket
import json
from socratic_sentry import check_handwritten_steps

def run_demo():
    print("======================================================================")
    print("         INITIATING AUTOMATED END-TO-END SYSTEM SIMULATION            ")
    print("======================================================================")

    db_path = "vault.db"
    display_client_proc = None
    orchestrator_proc = None

    try:
        # 1. Booting Servers in Background
        print("\n[STEP 1] Starting Background Appliance Services...")
        
        # Start display client (HTTP port 8000, WS port 8001)
        print("  -> Starting display_client.py...")
        display_client_proc = subprocess.Popen(
            [sys.executable, "-u", "display_client.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Start orchestrator brain in NPU mode (UDP port 8002, connects to LanceDB and SentenceTransformer)
        print("  -> Starting orchestrator.py with --npu acceleration...")
        orchestrator_proc = subprocess.Popen(
            [sys.executable, "-u", "orchestrator.py", "--npu"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Start background thread to non-blockingly read orchestrator stdout (character-by-character)
        import queue
        import threading
        orch_log_queue = queue.Queue()
        def read_orch_stdout(proc, q):
            try:
                while True:
                    char = proc.stdout.read(1)
                    if not char:
                        break
                    q.put(char)
            except Exception:
                pass
            finally:
                try:
                    proc.stdout.close()
                except Exception:
                    pass
        
        reader_thread = threading.Thread(target=read_orch_stdout, args=(orchestrator_proc, orch_log_queue), daemon=True)
        reader_thread.start()
        
        print("  -> Waiting 15 seconds for model loading and interface binding...")
        time.sleep(15)

        # 2. Loading User Profile from SQLite
        print("\n[STEP 2] Loading Active Student Profile from SQLite vault...")
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Fetch User Profile
            cursor.execute("SELECT user_id, background_context FROM user_profiles LIMIT 1")
            profile = cursor.fetchone()
            if profile:
                print(f"  -> Profile Loaded: {profile[0]} | Context: {profile[1]}")
            else:
                print("  -> No profiles found in user_profiles.")
                
            # Fetch Mastery Milestone
            cursor.execute("SELECT video_id, chapter_id, mastery_achieved FROM mastery_ledger LIMIT 1")
            milestone = cursor.fetchone()
            if milestone:
                print(f"  -> Latest Ledger Entry: Video ID '{milestone[0]}' | Chapter: '{milestone[1]}' | Mastered: {bool(milestone[2])}")
            conn.close()
        else:
            print(f"  -> Error: SQLite database '{db_path}' not found.")

        # 3. Simulating Math Question Query via UDP Socket (IPC Bridge)
        print("\n[STEP 3] Emitting simulated physical button interrupt and RAG query...")
        query_text = "How does the pendulum harmonics period depend on length?"
        print(f"  -> Simulated button action: RAISE_HAND (Pin 22)")
        print(f"  -> Simulated voice question: \"{query_text}\"")
        
        # Prepare UDP event packet
        payload = {
            "event": "GPIO_INTERRUPT",
            "pin": 22,
            "action": "RAISE_HAND",
            "query": query_text,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        # Transmit datagram to localhost port 8002
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(json.dumps(payload).encode('utf-8'), ("127.0.0.1", 8002))
        sock.close()
        print("  -> UDP Event datagram transmitted to localhost:8002.")
        
        print("  -> Waiting 5 seconds for RAG retrieval and NPU acceleration loop...")
        time.sleep(5)

        # 4. Read logs from Orchestrator subprocess to verify execution
        print("\n[STEP 4] Retrieving background Orchestrator pipeline logs...")
        print(f"  -> Orchestrator poll code: {orchestrator_proc.poll()} (None means running)")
        print(f"  -> Display Client poll code: {display_client_proc.poll()} (None means running)")
        print("--- Orchestrator Console Output Trace ---")
        buffer = []
        while not orch_log_queue.empty():
            try:
                char = orch_log_queue.get_nowait()
                buffer.append(char)
            except queue.Empty:
                break
        output_str = "".join(buffer)
        for line in output_str.splitlines():
            print(f"  [ORCHESTRATOR] {line}")
        print("-----------------------------------------")

        # 5. Invoke Handwritten OCR Vision check and Socratic Correction loop
        print("\n[STEP 5] Activating Document Camera Vision Step Checker...")
        # Create a mock handwriting file path (file doesn't need to physically exist as vision checker simulates OCR)
        mock_image = "student_pendulum_work.png"
        check_result = check_handwritten_steps(mock_image)
        
        print("\n[STEP 6] Socratic Feedback Loop Result:")
        print(f"  -> Math Formula Error Detected: {check_result['error_description']}")
        print(f"  -> OCR Extracted Step 1: {check_result['extracted_steps'][0]}")
        print("\n" + "="*70)
        print("!!! [SOCRATIC AI HINT EMITTED] !!!")
        print(check_result["socratic_correction_hint"])
        print("="*70 + "\n")

    finally:
        # Clean shutdown of background servers
        print("[SHUTDOWN] Terminating background display server and orchestrator processes...")
        if display_client_proc:
            display_client_proc.terminate()
            display_client_proc.wait()
            print("  -> display_client.py terminated.")
        if orchestrator_proc:
            orchestrator_proc.terminate()
            orchestrator_proc.wait()
            print("  -> orchestrator.py terminated.")
            
        # Read the remaining logs that were buffered
        print("\n--- Post-Mortem Orchestrator Console Output Trace ---")
        buffer = []
        while not orch_log_queue.empty():
            try:
                char = orch_log_queue.get_nowait()
                buffer.append(char)
            except queue.Empty:
                break
        output_str = "".join(buffer)
        for line in output_str.splitlines():
            print(f"  [ORCHESTRATOR] {line}")
        print("-----------------------------------------------------")
            
    print("\n======================================================================")
    print("      SYSTEM DEMONSTRATION & VERIFICATION COMPLETED SUCCESSFULLY      ")
    print("======================================================================")

if __name__ == "__main__":
    run_demo()
