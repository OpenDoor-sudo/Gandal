import os
import glob

# Search in the app data directory
pattern = r"C:\Users\lalyb\.gemini\antigravity\brain\1cf4807a-eb66-4109-a855-d902ff333a75\.system_generated\tasks\*"
print("Found logs:")
for f in glob.glob(pattern):
    print(f, os.path.getsize(f))
