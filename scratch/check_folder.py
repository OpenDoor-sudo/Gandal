import os

target_dir = os.path.join("curriculum_staging", "k12", "TSM", "Economics", "Extraeconomiques")
print("Exists?", os.path.exists(target_dir))
if os.path.exists(target_dir):
    for f in os.listdir(target_dir):
        print(repr(f))
