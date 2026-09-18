# run_agent.py - Resilient LiveKit Agent Wrapper with Auto-Failover
import subprocess
import time
import sys
import os
import signal
import socket
import shutil

print("=== RESILIENT LIVEKIT TUTOR AGENT WATCHER WITH AUTO-FAILOVER ===")
print("Running tutor agent with continuous health check, auto-restart, and offline failover.")
if hasattr(os, "geteuid") and os.geteuid() == 0:
    print("[FAIL] Do not run this with sudo. The LiveKit worker must use your user .env and PulseAudio.")
    print("       Use: python3 livekit_stack/agent/run_agent.py --online start")
    sys.exit(1)

cwd = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(cwd, "..", ".."))


def load_project_env():
    env_path = os.path.join(project_root, ".env")
    if not os.path.isfile(env_path):
        print("[WATCHER] No repo-root .env (keys stay unset).")
        return
    try:
        with open(env_path, "r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.lower().startswith("export "):
                    line = line[7:].strip()
                parts = line.split("=", 1)
                if len(parts) != 2:
                    continue
                key = parts[0].strip()
                value = parts[1].strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
        print("[WATCHER] Loaded repo-root .env (values not printed).")
    except Exception as err:
        print(f"[WATCHER] Failed to read .env: {err}")


load_project_env()

if "LIVEKIT_URL" in os.environ:
    url = os.environ["LIVEKIT_URL"]
    for scheme in ("ws://", "wss://", "http://", "https://"):
        needle = scheme + "localhost"
        if url.lower().startswith(needle):
            os.environ["LIVEKIT_URL"] = scheme + "127.0.0.1" + url[len(needle):]
            print("[WATCHER] Rewrote LIVEKIT_URL localhost → 127.0.0.1 (Linux IPv6).")
            break
elif "LIVEKIT_URL" not in os.environ:
    os.environ["LIVEKIT_URL"] = "ws://127.0.0.1:7880"

if not shutil.which("ffmpeg"):
    print("[WATCHER] ffmpeg is not on PATH. Tutor audio often fails on Linux. Install: sudo apt install ffmpeg")

def _probe_livekit(timeout=0.8):
    url = os.environ.get("LIVEKIT_URL", "ws://127.0.0.1:7880").strip()
    hostport = url
    for prefix in ("wss://", "ws://", "https://", "http://"):
        if hostport.lower().startswith(prefix):
            hostport = hostport[len(prefix):]
            break
    hostport = hostport.split("/", 1)[0]
    host, _, port_s = hostport.partition(":")
    host = (host or "127.0.0.1").replace("localhost", "127.0.0.1")
    try:
        port = int(port_s) if port_s else 7880
    except ValueError:
        port = 7880
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        sock.close()
        return True, host, port
    except Exception:
        return False, host, port

ok_lk, lk_host, lk_port = _probe_livekit()
if ok_lk:
    print(f"[WATCHER] LiveKit reachable at {lk_host}:{lk_port}")
else:
    print(
        f"[WATCHER] LiveKit NOT reachable at {lk_host}:{lk_port}. "
        "Gandho cannot join a room until you start a server "
        "(bash livekit_stack/run_livekit_server.sh) or set LIVEKIT_URL to LiveKit Cloud."
    )
if not os.environ.get("GOOGLE_API_KEY", "").strip():
    print("[WATCHER] GOOGLE_API_KEY is empty — Gemini Live will not speak.")

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

def _truthy_env(*names):
    for name in names:
        if os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on"):
            return True
    return False

# Mode flags
explicit_offline = "--offline" in sys.argv or _truthy_env("OFFLINE_MODE", "FORCE_OFFLINE")
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
                while time.time() - start_time < 45:
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
                    print("[WATCHER] Agent did not reach a healthy startup milestone within 45 seconds. Terminating it and retrying.")
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
