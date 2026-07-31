import psutil, os, glob

print("--- RUNNING PYTHON PROCESSES ---")
for p in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        cmd = " ".join(p.info['cmdline'] or [])
        if "python" in p.info['name'].lower() or "livekit" in cmd.lower():
            print(f"PID: {p.pid} | Cmd: {cmd[:120]}")
    except Exception as e:
        pass

print("\n--- AGENT LOG FILES ---")
log_files = glob.glob("*.log") + glob.glob("scratch/*.log") + glob.glob("agent*.log") + glob.glob("livekit*.log")
for f in log_files:
    print(f"Log File: {f}")
    with open(f, 'r', encoding='utf-8', errors='ignore') as lf:
        lines = lf.readlines()
        print("Last 10 lines:")
        for l in lines[-10:]:
            print("  ", l.strip())
