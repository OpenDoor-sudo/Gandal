# run_agent.py - Resilient LiveKit Agent Wrapper
import subprocess
import time
import sys
import os
import signal

print("=== RESILIENT LIVEKIT TUTOR AGENT WATCHER ===")
print("Running tutor_agent.py in an auto-restart loop. The agent may take a short time to initialize its LiveKit and model connections.")

cwd = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(cwd, "..", ".."))

is_offline = "--offline" in sys.argv or os.environ.get("OFFLINE_MODE") == "1"
agent_script = "tutor_agent_offline.py" if is_offline else "tutor_agent.py"
cli_args = [a for a in sys.argv[1:] if a != "--offline"]
cmd_arg = cli_args[0] if cli_args else "start"

args = [sys.executable, os.path.join(cwd, agent_script), cmd_arg]
log_path = os.path.abspath(os.path.join(project_root, "tutor_agent.log"))
print(f"[WATCHER] Selected Agent Mode: {'OFFLINE (' + agent_script + ')' if is_offline else 'ONLINE (' + agent_script + ')'}")

def wait_for_healthy_start(log_path):
    try:
        with open(log_path, "r", encoding="utf-8", errors="ignore") as log_file:
            content = log_file.read()
    except Exception:
        return False
    if "HTTP server listening" in content or "registered worker" in content or "Connecting to room" in content:
        return True
    return False

try:
    while True:
        print(f"\n[WATCHER] Starting agent process: {' '.join(args)}")
        with open(log_path, "a", encoding="utf-8") as log_file:
            log_file.write(f"\n--- WATCHER STARTING AGENT AT {time.ctime()} ---\n")
            log_file.flush()
            process = subprocess.Popen(args, cwd=cwd, stdout=log_file, stderr=log_file)
            healthy = False
            start_time = time.time()
            while time.time() - start_time < 20:
                if process.poll() is not None:
                    break
                if wait_for_healthy_start(log_path):
                    healthy = True
                    break
                time.sleep(0.5)

            if process.poll() is None and healthy:
                print("[WATCHER] Agent reached a healthy startup milestone. Leaving it running.")
                ret_code = process.wait()
            elif process.poll() is None:
                print("[WATCHER] Agent did not reach a healthy startup milestone within 20 seconds. Terminating it and retrying.")
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except Exception:
                    try:
                        os.kill(process.pid, signal.SIGTERM)
                    except Exception:
                        pass
                ret_code = 1
            else:
                ret_code = process.returncode

        if ret_code == 0:
            print("[WATCHER] Agent exited cleanly. If you expected it to stay running, it may have reached the end of its startup path or been stopped.")
        else:
            print(f"[WATCHER] Agent exited with code {ret_code}. Auto-restarting in 2 seconds...")
            time.sleep(2)
except KeyboardInterrupt:
    print("\n[WATCHER] Stopped by user.")
