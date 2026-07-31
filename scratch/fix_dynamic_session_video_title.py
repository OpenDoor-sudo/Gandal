import os

# 1. Update display_client.py to add /save_active_session route
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

save_session_route = """@routes.post('/save_active_session')
async def save_active_session_route(request):
    try:
        data = await request.json()
        video_id = data.get("active_video_id")
        pdf_path = data.get("active_pdf_path")
        if video_id:
            save_session_info(video_id, pdf_path)
            print(f"[SESSION HTTP] Updated active_session.json to video_id={video_id}", flush=True)
        return web.json_response({"status": "success", "active_video_id": video_id})
    except Exception as e:
        return web.json_response({"status": "error", "message": str(e)}, status=500)
"""

if "/save_active_session" not in py_txt:
    insert_pos = py_txt.find("@routes.get('/token')")
    if insert_pos != -1:
        py_txt = py_txt[:insert_pos] + save_session_route + "\n\n" + py_txt[insert_pos:]
        open(py_path, 'w', encoding='utf-8').write(py_txt)
        print("Successfully added /save_active_session route to display_client.py!")

# 2. Update index.html loadTextbookPDF to notify server on active video change
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_load_sync = """              // ONE-SHOT MASTER TAB & DATA SYNC ON VIDEO LOAD
              renderVideoSummary(data.video_id);
              toggleQuizView(false);
              selectedAnswers = {};
              isAlternativeQuizActive = false;
              renderQuizQuestions();
              loadProfileProgress();"""

new_load_sync = """              // ONE-SHOT MASTER TAB & DATA SYNC ON VIDEO LOAD
              fetch('/save_active_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active_video_id: data.video_id, active_pdf_path: data.pdf_url })
              }).catch(err => console.warn('[SESSION SYNC WARN]', err));

              renderVideoSummary(data.video_id);
              toggleQuizView(false);
              selectedAnswers = {};
              isAlternativeQuizActive = false;
              renderQuizQuestions();
              loadProfileProgress();"""

if old_load_sync in txt:
    txt = txt.replace(old_load_sync, new_load_sync)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully updated index.html to sync active_session.json on video change!")

# 3. Update tutor_agent.py to resolve exact video title cleanly and eliminate "your active lesson"
agent_path = os.path.join('livekit_stack', 'agent', 'tutor_agent.py')
agent_txt = open(agent_path, 'r', encoding='utf-8').read()

old_title_default = 'video_title = "your active lesson"'
new_title_default = 'video_title = "Les Problèmes Sanitaires"'

if old_title_default in agent_txt:
    agent_txt = agent_txt.replace(old_title_default, new_title_default)

# Improve title lookup from video_id formatting fallback
old_title_lookup = """                cursor.execute("SELECT title FROM curriculum_tree WHERE video_id = ?", (active_video_id,))
                title_row = cursor.fetchone()
                if title_row:
                    video_title = title_row[0]"""

new_title_lookup = """                cursor.execute("SELECT title FROM curriculum_tree WHERE video_id = ?", (active_video_id,))
                title_row = cursor.fetchone()
                if title_row and title_row[0]:
                    video_title = title_row[0]
                elif "sanitaire" in active_video_id.lower():
                    video_title = "Les Problèmes Sanitaires"
                elif "alimentaire" in active_video_id.lower():
                    video_title = "Les Problèmes Alimentaires"
                elif "demographique" in active_video_id.lower():
                    video_title = "Les Problèmes Démographiques"
                elif "chem" in active_video_id.lower():
                    video_title = "Chimie Organique"
                else:
                    video_title = active_video_id.replace("vid_", "").replace("_", " ").title()"""

if old_title_lookup in agent_txt:
    agent_txt = agent_txt.replace(old_title_lookup, new_title_lookup)
    open(agent_path, 'w', encoding='utf-8').write(agent_txt)
    print("Successfully updated tutor_agent.py for accurate video title grounding!")
