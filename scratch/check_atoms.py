import os
import struct

video_path = os.path.join("curriculum_staging", "k12", "TSM", "Economics", "Extraeconomiques", "02_Les problèmes sanitaires.mp4")
file_size = os.path.getsize(video_path)
print("File size:", file_size)

with open(video_path, "rb") as f:
    pos = 0
    while pos < file_size:
        f.seek(pos)
        data = f.read(8)
        if len(data) < 8:
            break
        size, name = struct.unpack(">I4s", data)
        name_str = name.decode('ascii', errors='ignore')
        print(f"Atom: {name_str} at {pos}, size {size}")
        if size == 0:
            print("Size 0 means extends to EOF")
            break
        if size == 1:
            # 64-bit size
            data64 = f.read(8)
            size = struct.unpack(">Q", data64)[0]
        pos += size
        if pos > 1000000000:
            break
