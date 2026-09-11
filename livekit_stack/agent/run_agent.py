# run_agent.py - Resilient LiveKit Agent Wrapper with Auto-Failover
import subprocess
import time
import sys
import os
import signal
import socket

print("=== RESILIENT LIVEKIT TUTOR AGENT WATCHER WITH AUTO-FAILOVER ===")
print("Running tutor agent with continuous health check, auto-restart, and offline failover.")

cwd = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(cwd, "..", ".."))

def check_cloud_connectivity(timeout=1.5):
    """Probe if cloud internet (DNS/HTTPS) is reachable."""
    endpoints = [
        ("8.8.8.8", 53),
        ("1.1.1.1", 53),
        ("generativelanguage.googleapis.com", 443)
    ]
    for host, port in endpoints:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(timeout)
            s.connect((host, port))
            s.close()
            return True
        except Exception:
            continue
    return False

# Mode flags
explicit_offline = "--offline" in sys.argv or os.environ.get("OFFLINE_MODE") == "1"
explicit_online = "--online" in sys.argv
auto_mode = not explicit_offline and not explicit_online

cli_args = [a for a in sys.argv[1:] if a not in ("--offline", "--online", "--auto")]
cmd_arg = cli_args[0] if cli_args else "start"
log_path = os.path.abspath(os.path.join(project_root, "tutor_agent.log"))

def resolve_agent_script():
    if explicit_offline:
        return "tutor_agent_offline.py", "EXPLICIT OFFLINE"
    if explicit_online:
        return "tutor_agent.py", "EXPLICIT ONLINE"
    
    # Auto-mode: probe connectivity
    has_internet = check_cloud_connectivity()
    if has_internet:
        return "tutor_agent.py", "AUTO-ONLINE (Cloud Connected)"
    else:
        return "tutor_agent_offline.py", "AUTO-OFFLINE (Internet Unreachable - Failover)"

def wait_for_healthy_start(log_path):
    try:
        with open(log_path, "r", encoding="utf-8", errors="ignore") as log_file:
            content = log_file.read()
    except Exception:
        return False
    if "HTTP server listening" in content or "registered worker" in content or "Connecting to room" in content:
        return True
    return False

def main():
    try:
        while True:
            script_name, mode_desc = resolve_agent_script()
            args = [sys.executable, os.path.join(cwd, script_name), cmd_arg]
            print(f"\n[WATCHER] Active Mode: {mode_desc} -> Starting agent process: {' '.join(args)}")
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

if __name__ == "__main__":
    main()
