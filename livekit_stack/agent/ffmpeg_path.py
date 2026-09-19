"""Find ffmpeg even when conda PATH hides /usr/bin (common on Linux desktops)."""
from __future__ import annotations

import os
import shutil
import sys


def ffmpeg_search_dirs():
    dirs = []
    for raw in (
        os.environ.get("CONDA_PREFIX", ""),
        sys.prefix,
        os.path.expanduser("~/.local"),
        "/usr",
        "/usr/local",
        "/snap",
        "/opt/homebrew",
    ):
        if raw:
            dirs.append(os.path.join(raw, "bin"))
    extra = os.environ.get("FFMPEG_DIR", "").strip()
    if extra:
        dirs.insert(0, extra)
    return dirs


def ffmpeg_candidates():
    found = []
    env_bin = (os.environ.get("FFMPEG_BINARY") or os.environ.get("FFMPEG_PATH") or "").strip()
    if env_bin:
        found.append(env_bin)
    which = shutil.which("ffmpeg")
    if which:
        found.append(which)
    for directory in ffmpeg_search_dirs():
        found.append(os.path.join(directory, "ffmpeg"))
    found.extend(
        (
            "/usr/bin/ffmpeg",
            "/usr/local/bin/ffmpeg",
            "/bin/ffmpeg",
            "/snap/bin/ffmpeg",
        )
    )
    ordered = []
    for path in found:
        if path and path not in ordered:
            ordered.append(path)
    return ordered


def find_ffmpeg():
    for path in ffmpeg_candidates():
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    return ""


def ensure_ffmpeg_on_path():
    """Put ffmpeg's directory first on PATH so PyAV / LiveKit can spawn it."""
    path = find_ffmpeg()
    if not path:
        return ""
    directory = os.path.dirname(path)
    current = os.environ.get("PATH", "")
    parts = current.split(os.pathsep) if current else []
    if directory not in parts:
        os.environ["PATH"] = directory + (os.pathsep + current if current else "")
    os.environ["FFMPEG_BINARY"] = path
    return path
