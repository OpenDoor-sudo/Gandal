import os

log_path = "sentry_vision.log"
if os.path.exists(log_path):
    print("=== sentry_vision.log ===")
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        for line in lines[-50:]:
            print(line.strip())
else:
    print("sentry_vision.log not found")
