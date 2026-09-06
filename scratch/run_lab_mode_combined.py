# scratch/run_lab_mode_combined.py
import os
import sys
import time
import subprocess

os.environ["DEPLOYMENT_MODE"] = "LAB"
print("[RUNNER] Set DEPLOYMENT_MODE = LAB")

# Start display_client in a subprocess with unbuffered python output
server_proc = subprocess.Popen(
    [sys.executable, "-u", "display_client.py"],
    cwd="c:/Users/lalyb/Desktop/ventuno_ai_testbed",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)
print(f"[RUNNER] Started display_client PID: {server_proc.pid}")

time.sleep(4)

if server_proc.poll() is not None:
    stdout, stderr = server_proc.communicate()
    print("=== SERVER DIED EARLY ===")
    print("STDOUT:", stdout)
    print("STDERR:", stderr)
else:
    try:
        test_res = subprocess.run([sys.executable, "scratch/test_lab_mode.py"], cwd="c:/Users/lalyb/Desktop/ventuno_ai_testbed", capture_output=True, text=True)
        print("=== TEST OUTPUT ===")
        print(test_res.stdout)
        if test_res.stderr:
            print("=== TEST ERRORS ===")
            print(test_res.stderr)
        print(f"=== EXIT CODE: {test_res.returncode} ===")
    finally:
        server_proc.terminate()
        stdout, stderr = server_proc.communicate()
        print("=== SERVER LOGS ===")
        print(stdout)
        if stderr:
            print("=== SERVER ERRORS ===")
            print(stderr)
