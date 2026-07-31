import os

rt_path = "C:/Users/lalyb/AppData/Roaming/Python/Python314/site-packages/livekit/plugins/google/realtime/realtime_api.py"
txt = open(rt_path, "r", encoding="utf-8").read()

# 1. Hotpatch line 296 mutable = True (Rule #1 in AGENTS.md)
old_mutable = "        mutable = is_given(chat_ctx)"
new_mutable = "        mutable = True"

if old_mutable in txt:
    txt = txt.replace(old_mutable, new_mutable)
    print("Hotpatched mutable = True!")

# 2. Hotpatch _handle_server_content so it automatically starts new generation if current_gen is None
old_content_check = """        if not current_gen:
            if self._rejected_tool_calls:
                logger.debug(
                    "ignoring server content from a rejected tool call turn",
                    extra={"server_content": server_content.model_dump_json(exclude_none=True)},
                )
            else:
                logger.warning("received server content but no active generation.")
            return"""

new_content_check = """        if not current_gen:
            if self._rejected_tool_calls:
                logger.debug(
                    "ignoring server content from a rejected tool call turn",
                    extra={"server_content": server_content.model_dump_json(exclude_none=True)},
                )
                return
            else:
                self._start_new_generation()
                current_gen = self._current_generation"""

if old_content_check in txt:
    txt = txt.replace(old_content_check, new_content_check)
    print("Hotpatched _handle_server_content auto-generation!")

open(rt_path, "w", encoding="utf-8").write(txt)
print("Successfully hotpatched realtime_api.py!")
