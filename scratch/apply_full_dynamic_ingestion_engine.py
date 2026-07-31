import os

py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

# 1. Add /get_quiz_questions and /get_next_lesson endpoints to display_client.py
endpoints_code = """        # Route to fetch dynamic Quiz MCQs from vault.db for any ingested video
        if clean_path.startswith('/get_quiz_questions'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            video_id = params.get('video_id', [''])[0]
            
            mcq_list = { "main": [], "alternative": [] }
            try:
                conn = sqlite3.connect(VAULT_DB_PATH)
                cur = conn.cursor()
                cur.execute(\"\"\"
                    SELECT question_id, question, option_a, option_b, option_c, option_d, correct_option, is_alternative
                    FROM video_quiz_mcqs
                    WHERE video_id = ?
                    ORDER BY is_alternative ASC, question_id ASC
                \"\"\", (video_id,))
                rows = cur.fetchall()
                conn.close()
                
                main_qs = []
                alt_qs = []
                for r in rows:
                    item = {
                        "id": r[0],
                        "question": r[1],
                        "options": { "A": r[2], "B": r[3], "C": r[4], "D": r[5] },
                        "correct": r[6]
                    }
                    if r[7] == 1:
                        alt_qs.append(item)
                    else:
                        main_qs.append(item)
                        
                mcq_list = { "main": main_qs, "alternative": alt_qs }
            except Exception as err:
                print(f"[QUIZ FETCH DB ERROR] {err}")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(mcq_list).encode('utf-8'))
            return

        # Route to get Next Lesson in Curriculum sequence dynamically from vault.db
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

if "/get_quiz_questions" not in py_txt:
    token_pos = py_txt.find("if clean_path.startswith('/token'):")
    if token_pos != -1:
        py_txt = py_txt[:token_pos] + endpoints_code + "\n\n        " + py_txt[token_pos:]
        open(py_path, 'w', encoding='utf-8').write(py_txt)
        print("Successfully added /get_quiz_questions and /get_next_lesson endpoints to display_client.py!")

# 2. Update SUBMIT_QUIZ grading in display_client.py to query video_quiz_mcqs in vault.db FIRST
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_grading_loop = """                    correct_count = 0
                    questions = QUIZ_QUESTIONS.get(track_key, {}).get("alternative" if is_alt else "main", [])
                    
                    if is_practice:
                        questions = questions[3:]
                    else:
                        questions = questions[:3]
                        
                    total_count = len(questions)
                    for q in questions:
                        q_id = str(q["id"])
                        correct_ans = q["correct"]
                        student_ans = student_answers.get(q_id)
                        if student_ans == correct_ans:
                            correct_count += 1"""

new_grading_loop = """                    correct_count = 0
                    total_count = 0

                    # 1. Query vault.db video_quiz_mcqs table first for dynamic ingested questions
                    try:
                        conn_q = sqlite3.connect(VAULT_DB_PATH)
                        cur_q = conn_q.cursor()
                        cur_q.execute(\"\"\"
                            SELECT question_id, correct_option
                            FROM video_quiz_mcqs
                            WHERE video_id = ? AND is_alternative = ?
                        \"\"\", (video_id, 1 if is_alt else 0))
                        db_questions = cur_q.fetchall()
                        conn_q.close()

                        if db_questions:
                            total_count = len(db_questions)
                            for q_id, correct_ans in db_questions:
                                student_ans = student_answers.get(str(q_id))
                                if student_ans == correct_ans:
                                    correct_count += 1
                    except Exception as q_err:
                        print(f"[QUIZ DB GRADING ERROR] {q_err}")

                    # 2. Fallback to hardcoded QUIZ_QUESTIONS dataset if not in DB
                    if total_count == 0:
                        questions = QUIZ_QUESTIONS.get(track_key, {}).get("alternative" if is_alt else "main", [])
                        if is_practice:
                            questions = questions[3:]
                        else:
                            questions = questions[:3]
                        total_count = len(questions)
                        for q in questions:
                            q_id = str(q["id"])
                            correct_ans = q["correct"]
                            student_ans = student_answers.get(q_id)
                            if student_ans == correct_ans:
                                correct_count += 1"""

if old_grading_loop in py_txt:
    py_txt = py_txt.replace(old_grading_loop, new_grading_loop)
    open(py_path, 'w', encoding='utf-8').write(py_txt)
    print("Successfully updated display_client.py SUBMIT_QUIZ grading to query vault.db!")

# 3. Update index.html to fetch questions dynamically and advance to next lesson dynamically
html_path = 'index.html'
txt = open(html_path, 'r', encoding='utf-8').read()

old_advance_func = """      function advanceToNextCurriculumVideo() {
        const subjectVideoSequence = [
          {
            id: "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques",
            track: "k12/12th_SM/Economics"
          },
          {
            id: "vid_chemistry_organic_chemistry_chemistry",
            track: "k12/12th_SM/chemistry"
          },
          {
            id: "vid_physics_01",
            track: "k12/12th_SM/physics"
          },
          {
            id: "vid_philosophy_01",
            track: "independent_learner/philosophy/stoicism_and_ethics"
          }
        ];

        const curVid = activeVideoId || window.ACTIVE_DATABASE_VIDEO_ID;
        const curIndex = subjectVideoSequence.findIndex(s => s.id === curVid);

        if (curIndex !== -1 && curIndex < subjectVideoSequence.length - 1) {
          const nextItem = subjectVideoSequence[curIndex + 1];
          selectedGoalTrack = nextItem.track;
          window.currentTrack = nextItem.track;
          loadTextbookPDF(nextItem.id);
          showToastNotification("Level Up!", "Congratulations! Loaded the next video in your curriculum.");
        } else {
          showToastNotification("Curriculum Completed", "Awesome job! You have mastered all available lessons in this module.");
        }
      }"""

new_advance_func = """      async function advanceToNextCurriculumVideo() {
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

if old_advance_func in txt:
    txt = txt.replace(old_advance_func, new_advance_func)
    open(html_path, 'w', encoding='utf-8').write(txt)
    print("Successfully updated index.html advanceToNextCurriculumVideo for dynamic DB resolution!")

print("All dynamic ingestion engine updates applied cleanly!")
