"""Regression checks for the Linux port: session path, STT stub, lab voice, profiles."""
import ast
import os
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AGENT_DIR = ROOT / "livekit_stack" / "agent"
WINDOWS_SESSION = "c:/Users/lalyb/Desktop/ventuno_ai_testbed/active_session.json"


def _read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


class LinuxPortSourceTests(unittest.TestCase):
    def test_agents_do_not_hardcode_windows_session_path(self):
        for rel in (
            "livekit_stack/agent/tutor_agent.py",
            "livekit_stack/agent/tutor_agent_offline.py",
            "livekit_stack/agent/tutor_agent_online.py",
            "livekit_stack/agent/tutor_agent_realtime.py",
        ):
            src = _read(rel)
            self.assertNotIn(WINDOWS_SESSION, src, rel)
            self.assertIn("active_session.json", src, rel)
            self.assertIn("GANDHO_PROJECT_ROOT", src, rel)

    def test_display_client_session_is_project_root(self):
        sys.path.insert(0, str(ROOT))
        from scratch.test_project_paths import load_display_client

        module = load_display_client()
        self.assertEqual(Path(module.SESSION_JSON_PATH), ROOT / "active_session.json")

    def test_run_agent_honors_force_offline(self):
        src = _read("livekit_stack/agent/run_agent.py")
        self.assertIn('explicit_offline = "--offline" in sys.argv or _truthy_env("OFFLINE_MODE", "FORCE_OFFLINE")', src)
        ns = {"os": os}
        tree = ast.parse(src)
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name == "_truthy_env":
                exec(compile(ast.Module(body=[node], type_ignores=[]), "run_agent.py", "exec"), ns)
                break
        old = os.environ.get("FORCE_OFFLINE")
        os.environ["FORCE_OFFLINE"] = "1"
        try:
            self.assertTrue(ns["_truthy_env"]("FORCE_OFFLINE", "OFFLINE_MODE"))
        finally:
            if old is None:
                os.environ.pop("FORCE_OFFLINE", None)
            else:
                os.environ["FORCE_OFFLINE"] = old

    def test_pywin32_is_windows_only(self):
        req = _read("livekit_stack/agent/requirements.txt")
        self.assertIn('sys_platform == "win32"', req)

    def test_docker_cmd_uses_watcher(self):
        docker = _read("livekit_stack/agent/Dockerfile")
        self.assertIn("run_agent.py", docker)
        self.assertNotIn('"tutor_agent.py", "start"', docker)

    def test_native_audio_stub_is_gone(self):
        src = _read("livekit_stack/agent/tutor_agent_offline.py")
        self.assertNotIn("class GemmaNativeAudioSTT", src)
        self.assertNotIn("[AUDIO_IN:", src)
        self.assertIn("class FasterWhisperSTT", src)

    def test_physics_canvas_handles_voice_commands(self):
        src = _read("antigravity_labs/web_labs_package/src/physics/physics_canvas_view.js")
        self.assertIn("executeVoiceCommand(cmd)", src)
        self.assertIn("releaseSuspendedBalls()", src)
        self.assertIn("this.world.gravityY", src)

    def test_student_id_alseny_resolves_to_Alseny_dir(self):
        sys.path.insert(0, str(AGENT_DIR))
        import student_memory

        path = student_memory.get_student_dir("alseny")
        self.assertEqual(Path(path).name, "Alseny")
        self.assertTrue((Path(path) / "session_state.md").is_file())
        # Must not have created a lowercase sibling.
        self.assertFalse((ROOT / "student_profiles" / "alseny").exists())

    def test_handwriting_archive_insert_matches_live_schema(self):
        db_path = ROOT / "vault.db"
        self.assertTrue(db_path.is_file())
        conn = sqlite3.connect(db_path)
        cols = {row[1] for row in conn.execute("PRAGMA table_info(handwriting_archive)")}
        conn.close()
        self.assertIn("subject", cols)
        self.assertIn("image_path", cols)
        self.assertNotIn("user_id", cols)
        self.assertNotIn("sentry_verified", cols)
        src = _read("display_client.py")
        self.assertIn(
            "INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)",
            src,
        )
        self.assertNotIn(
            "INSERT INTO handwriting_archive (user_id, video_id, chapter_id, quiz_type, score, sentry_verified)",
            src,
        )

    def test_handwriting_insert_roundtrip(self):
        src_db = ROOT / "vault.db"
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "vault.db"
            dest.write_bytes(src_db.read_bytes())
            conn = sqlite3.connect(dest)
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO handwriting_archive (subject, video_id, chapter_id, image_path, extracted_text, score, passed)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                ("Economics", "vid_test", "ch_test", "quiz_submit/main", "{}", 90.0, 1),
            )
            conn.commit()
            row = cur.execute(
                "SELECT subject, image_path, score FROM handwriting_archive WHERE video_id = ?",
                ("vid_test",),
            ).fetchone()
            conn.close()
            self.assertEqual(row, ("Economics", "quiz_submit/main", 90.0))


if __name__ == "__main__":
    unittest.main()
