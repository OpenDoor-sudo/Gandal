"""Linux Gemini Live / LiveKit voice path regressions."""
import ast
import os
import socket
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
WINDOWS_SESSION = "c:/Users/lalyb/Desktop/ventuno_ai_testbed/active_session.json"


def _read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


class LinuxVoiceSourceTests(unittest.TestCase):
    def test_online_agent_skips_windows_vad_mock_on_linux(self):
        src = _read("livekit_stack/agent/tutor_agent.py")
        self.assertIn("lancedb is not installed", src)
        self.assertIn('sys.platform == "win32"', src)
        self.assertIn("prefer_ipv4_livekit_url", src)
        self.assertIn("greet_existing_student_mics", src)
        self.assertIn('topic="gandho-status"', src)
        self.assertIn("ws://127.0.0.1:7880", src)
        self.assertNotIn(WINDOWS_SESSION, src)
        self.assertIn("on_early_audio_track", src)
        self.assertIn("Gemini session is live", src)
        self.assertIn("ensure_ffmpeg_on_path", src)
        self.assertIn("/usr/bin/ffmpeg", _read("livekit_stack/agent/ffmpeg_path.py"))
        self.assertIn("CONDA_PREFIX", _read("livekit_stack/agent/ffmpeg_path.py"))

    def test_index_rewrites_localhost_and_does_not_hide_audio(self):
        src = _read("index.html")
        self.assertIn("rewriteLocalhost", src)
        self.assertIn("gandho-livekit-audio", src)
        self.assertIn("connectWithTimeout", src)
        self.assertIn("/api/voice_status", src)
        self.assertIn("ws://127.0.0.1:7880", src)
        self.assertNotIn('lkAudioTrack.style.display = "none"', src)
        self.assertNotIn("wss://gandaledu-uqy2on78.livekit.cloud", src)
        self.assertIn("worker_running", src)
        self.assertIn("ffmpeg not visible", src)

    def test_run_agent_loads_env_and_refuses_sudo(self):
        src = _read("livekit_stack/agent/run_agent.py")
        self.assertIn("load_project_env", src)
        self.assertIn("geteuid", src)
        self.assertIn("_probe_livekit", src)
        self.assertIn("45", src)

    def test_pywin32_stays_windows_only(self):
        self.assertIn('sys_platform == "win32"', _read("livekit_stack/agent/requirements.txt"))

    def test_env_example_uses_ipv4_loopback(self):
        src = _read(".env.example")
        self.assertIn("LIVEKIT_URL=ws://127.0.0.1:7880", src)
        self.assertNotIn("LIVEKIT_URL=ws://localhost:7880", src)

    def test_livekit_server_helper_exists(self):
        helper = ROOT / "livekit_stack" / "run_livekit_server.sh"
        self.assertTrue(helper.is_file())
        src = helper.read_text(encoding="utf-8")
        self.assertIn("docker compose", src)
        self.assertIn("7880", src)
        self.assertIn("Do not start LiveKit with sudo", src)


class LinuxVoiceUnitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT))
        from scratch.test_project_paths import load_display_client

        cls.dc = load_display_client()

    def test_prefer_ipv4_rewrites_localhost(self):
        self.assertEqual(
            self.dc.prefer_ipv4_livekit_url("ws://localhost:7880"),
            "ws://127.0.0.1:7880",
        )
        self.assertEqual(
            self.dc.prefer_ipv4_livekit_url("wss://proj.livekit.cloud"),
            "wss://proj.livekit.cloud",
        )

    def test_connect_urls_lead_with_ipv4(self):
        urls = self.dc.livekit_connect_urls("ws://localhost:7880")
        self.assertEqual(urls[0], "ws://127.0.0.1:7880")
        self.assertIn("ws://localhost:7880", urls)

    def test_probe_livekit_tcp_closed_port(self):
        reachable, host, port, err = self.dc.probe_livekit_tcp("ws://127.0.0.1:9", timeout=0.2)
        self.assertFalse(reachable)
        self.assertEqual(host, "127.0.0.1")
        self.assertEqual(port, 9)
        self.assertTrue(err)

    def test_probe_livekit_tcp_open_ephemeral(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(("127.0.0.1", 0))
        server.listen(1)
        port = server.getsockname()[1]
        try:
            reachable, host, got_port, err = self.dc.probe_livekit_tcp(
                f"ws://127.0.0.1:{port}", timeout=0.5
            )
            self.assertTrue(reachable)
            self.assertEqual(host, "127.0.0.1")
            self.assertEqual(got_port, port)
            self.assertEqual(err, "")
        finally:
            server.close()

    def test_find_ffmpeg_sees_usr_bin_even_if_which_fails(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "ffmpeg_path_under_test", ROOT / "livekit_stack" / "agent" / "ffmpeg_path.py"
        )
        fp = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(fp)
        self.assertIn("/usr/bin/ffmpeg", fp.ffmpeg_candidates())
        found = fp.find_ffmpeg()
        if found:
            self.assertTrue(os.path.isfile(found))

    def test_display_client_finds_ffmpeg_outside_conda_path(self):
        path = self.dc.find_ffmpeg()
        self.assertTrue(path)
        self.assertTrue(os.path.isfile(path))
        status = self.dc.worker_heartbeat_status()
        self.assertIn("running", status)

    def test_token_jwt_requests_default_unnamed_agent(self):
        src = _read("display_client.py")
        self.assertIn('payload["roomConfig"] = {"agents": [{}]}', src)
        self.assertIn("worker_heartbeat", src)

    def test_force_offline_from_run_agent_helper(self):
        src = _read("livekit_stack/agent/run_agent.py")
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


if __name__ == "__main__":
    unittest.main()
