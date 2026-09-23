"""Gandal Classroom — OpenMAIC-style lessons beside Our Space.

Original Gandal module. The scene types (slides, 3D, simulation, game,
mind map, in-browser code, and a teacher who can operate the page) follow
the Deep Interactive idea in THU-MAIC/OpenMAIC (MIT). This package does not
vendor that app, its Chinese locales, or its skill files.
"""

from gandal_classroom.api import generate_payload, handle_http, status_payload

__all__ = ["generate_payload", "handle_http", "status_payload"]
