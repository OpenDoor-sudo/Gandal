import urllib.parse
import os

test_clean_path = "/curriculum_staging/k12/TSM/Economics/Extraeconomiques/02_Les%20probl%C3%A8mes%20sanitaires.mp4"
unquoted = urllib.parse.unquote(test_clean_path).replace('/curriculum_staging/', '', 1).lstrip('/')
print("unquoted:", repr(unquoted))
staging_file = os.path.join(os.path.abspath('.'), 'curriculum_staging', unquoted)
print("staging_file:", repr(staging_file))
print("os.path.exists(staging_file):", os.path.exists(staging_file))
