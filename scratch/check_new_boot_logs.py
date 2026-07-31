import os

task_log_dir = "C:/Users/lalyb/.gemini/antigravity/brain/091a8f5c-693a-4b8e-9344-96b3d1119532/.system_generated/tasks"
for task_id in ["task-9857", "task-9859", "task-9861"]:
    log_path = os.path.join(task_log_dir, f"{task_id}.log")
    print(f"=== {task_id}.log ===")
    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            print(content[-1200:])  # Print last 1200 chars
    else:
        print("Not found")
    print("-" * 50)
