import os
import glob
import datetime

for f in glob.glob("*"):
    mtime = os.path.getmtime(f)
    mtime_dt = datetime.datetime.fromtimestamp(mtime)
    print(f"{f:<40} {os.path.getsize(f):>10} bytes   Last modified: {mtime_dt}")
