import json

transcript_path = r"C:\Users\lalyb\.gemini\antigravity\brain\1cf4807a-eb66-4109-a855-d902ff333a75\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

data = json.loads(lines[3032])
print(f"=== Line 3032 ({data.get('type')}, {data.get('source')}) ===")
print("Content:")
print(data.get("content"))
print("=" * 60)
