import importlib.util
import os
import sys
import tempfile
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_display_client():
    stub = types.ModuleType("orchestrator")
    stub.check_subject_gating = lambda *args, **kwargs: (True, "")
    stub.get_subject_by_video_id = lambda video_id: "Physics"
    sys.modules["orchestrator"] = stub

    spec = importlib.util.spec_from_file_location("display_client_under_test", ROOT / "display_client.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_project_files_are_resolved_from_workspace_root():
    with tempfile.TemporaryDirectory() as temp_dir:
        os.chdir(temp_dir)
        module = load_display_client()

        assert Path(module.TRANSLATION_CACHE_FILE).is_absolute()
        assert Path(module.TRANSLATION_CACHE_FILE).parent == ROOT
        assert Path(module.SESSION_JSON_PATH).parent == ROOT


if __name__ == "__main__":
    test_project_files_are_resolved_from_workspace_root()
    print("path regression test passed")
