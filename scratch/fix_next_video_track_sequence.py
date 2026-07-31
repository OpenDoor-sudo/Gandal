import os

# 1. Update /get_next_lesson in display_client.py
py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_next_lesson_endpoint = """        # Route to get Next Lesson in Curriculum sequence dynamically from vault.db
        if clean_path.startswith('/get_next_lesson'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            video_id = params.get('video_id', [''])[0]
            
            next_lesson_info = {}
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute("SELECT id, track_id FROM curriculum_tree WHERE video_id = ?", (video_id,))
                row = cur.fetchone()
                if row:
                    cur_id, track_id = row
                    cur.execute(\"\"\"
                        SELECT video_id, track_id, title
                        FROM curriculum_tree
                        WHERE track_id = ? AND id > ?
                        ORDER BY id ASC LIMIT 1
                    \"\"\", (track_id, cur_id))
                    next_row = cur.fetchone()
                    if next_row:
                        next_lesson_info = {
                            "video_id": next_row[0],
                            "track_id": next_row[1],
                            "title": next_row[2]
                        }
                conn.close()
            except Exception as err:
                print(f"[NEXT LESSON DB ERROR] {err}")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(next_lesson_info).encode('utf-8'))
            return"""

new_next_lesson_endpoint = """        # Route to get Next Lesson in Curriculum sequence dynamically from vault.db
        if clean_path.startswith('/get_next_lesson'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            video_id = params.get('video_id', [''])[0]
            
            next_lesson_info = {}
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute("SELECT rowid, video_id, chapter_id, title FROM curriculum_tree ORDER BY rowid ASC")
                all_rows = cur.fetchall()
                conn.close()
                
                subject_prefix = ""
                if "_" in video_id:
                    parts = video_id.split("_")
                    if len(parts) >= 2:
                        subject_prefix = parts[0] + "_" + parts[1]
                        
                cur_idx = -1
                for idx, r in enumerate(all_rows):
                    if r[1] == video_id:
                        cur_idx = idx
                        break
                        
                if cur_idx != -1:
                    same_subject_next = None
                    for idx in range(cur_idx + 1, len(all_rows)):
                        if subject_prefix and all_rows[idx][1].startswith(subject_prefix):
                            same_subject_next = all_rows[idx]
                            break
                            
                    if same_subject_next:
                        next_lesson_info = {
                            "video_id": same_subject_next[1],
                            "chapter_id": same_subject_next[2],
                            "title": same_subject_next[3],
                            "same_subject": True
                        }
                    elif cur_idx + 1 < len(all_rows):
                        next_row = all_rows[cur_idx + 1]
                        next_lesson_info = {
                            "video_id": next_row[1],
                            "chapter_id": next_row[2],
                            "title": next_row[3],
                            "same_subject": False
                        }
            except Exception as err:
                print(f"[NEXT LESSON DB ERROR] {err}")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(next_lesson_info).encode('utf-8'))
            return"""

if old_next_lesson_endpoint in py_txt:
    py_txt = py_txt.replace(old_next_lesson_endpoint, new_next_lesson_endpoint)
    open(py_path, 'w', encoding='utf-8').write(py_txt)
    print("Successfully updated display_client.py /get_next_lesson endpoint!")
else:
    print("WARNING: Could not find old_next_lesson_endpoint in display_client.py")

# 2. Update advanceToNextCurriculumVideo in index.html
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_advance_js = """      async function advanceToNextCurriculumVideo() {
        const curVid = activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID;
        try {
          const resp = await fetch(`/get_next_lesson?video_id=${curVid}`);
          const nextData = await resp.json();
          if (nextData && nextData.video_id) {
            selectedGoalTrack = nextData.track_id || selectedGoalTrack;
            window.currentTrack = nextData.track_id || window.currentTrack;
            loadTextbookPDF(nextData.video_id);
            showToastNotification("Level Up!", `Congratulations! Loaded next lesson: '${nextData.title || nextData.video_id}'`);
            return;
          }
        } catch (e) {
          console.warn("[NEXT LESSON FETCH WARNING]", e);
        }

        // Static sequence fallback
        const subjectVideoSequence = [
          { id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques", track: "k12/12th_SM/Economics" },
          { id: "vid_chemistry_organic_chemistry_chemistry", track: "k12/12th_SM/chemistry" },
          { id: "vid_physics_01", track: "k12/12th_SM/physics" }
        ];

        const curIndex = subjectVideoSequence.findIndex(s => s.id === curVid);
        if (curIndex !== -1 && curIndex < subjectVideoSequence.length - 1) {
          const nextItem = subjectVideoSequence[curIndex + 1];
          selectedGoalTrack = nextItem.track;
          window.currentTrack = nextItem.track;
          loadTextbookPDF(nextItem.id);
          showToastNotification("Level Up!", "Loaded next video in curriculum!");
        } else {
          showToastNotification("Curriculum Completed", "Awesome job! You have mastered all available lessons in this module.");
        }
      }"""

new_advance_js = """      async function advanceToNextCurriculumVideo() {
        const curVid = activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID;
        try {
          const resp = await fetch(`/get_next_lesson?video_id=${curVid}`);
          const nextData = await resp.json();
          if (nextData && nextData.video_id) {
            loadTextbookPDF(nextData.video_id);
            showToastNotification(
              nextData.same_subject ? "Next Lesson in Subject" : "Next Module Track",
              `Now playing: '${nextData.title || nextData.video_id}'`
            );
            const sommaireBtn = document.querySelector('[onclick*="timestamps"]') || document.getElementById("timestampsTabBtn");
            if (sommaireBtn) {
              switchSidebarTab("timestamps", sommaireBtn);
            }
            return;
          }
        } catch (e) {
          console.warn("[NEXT LESSON FETCH WARNING]", e);
        }

        // Static fallback for Economics track
        const econSequence = [
          "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
          "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires",
          "vid_economics_extraeconomiques_03_probl_mes_alimentaires"
        ];
        const curIndex = econSequence.indexOf(curVid);
        if (curIndex !== -1 && curIndex < econSequence.length - 1) {
          loadTextbookPDF(econSequence[curIndex + 1]);
          showToastNotification("Next Economics Lesson", "Loaded next video in Economics!");
          const sommaireBtn = document.querySelector('[onclick*="timestamps"]') || document.getElementById("timestampsTabBtn");
          if (sommaireBtn) switchSidebarTab("timestamps", sommaireBtn);
        } else {
          showToastNotification("Subject Completed", "Congratulations! You have completed all lessons in this subject.");
        }
      }"""

if old_advance_js in txt:
    txt = txt.replace(old_advance_js, new_advance_js)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully updated index.html advanceToNextCurriculumVideo for same-subject progression!")
else:
    print("WARNING: Could not find old_advance_js in index.html")

print("Fix applied successfully!")
