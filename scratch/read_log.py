import os

log_path = r"C:\Users\lalyb\.gemini\antigravity\brain\1cf4807a-eb66-4109-a855-d902ff333a75\.system_generated\tasks\task-4059.log"
if os.path.exists(log_path):
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        print("Log content:")
        print(f.read())
else:
    print(f"Log file not found at {log_path}")
