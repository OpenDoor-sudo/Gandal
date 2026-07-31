import os

py_path = 'display_client.py'
py_txt = open(py_path, 'r', encoding='utf-8').read()

old_db_grading = """                        if db_questions:
                            total_count = len(db_questions)
                            for q_id, correct_ans in db_questions:
                                student_ans = student_answers.get(str(q_id))
                                if student_ans == correct_ans:
                                    correct_count += 1"""

new_db_grading = """                        if db_questions:
                            if is_practice:
                                target_db_questions = db_questions[3:]
                            else:
                                target_db_questions = db_questions[:3]
                            if not target_db_questions:
                                target_db_questions = db_questions
                            total_count = len(target_db_questions)
                            for q_id, correct_ans in target_db_questions:
                                student_ans = student_answers.get(str(q_id))
                                if student_ans == correct_ans:
                                    correct_count += 1"""

if old_db_grading in py_txt:
    py_txt = py_txt.replace(old_db_grading, new_db_grading)
    print("Successfully synchronized backend DB quiz grading slice with frontend!")
else:
    print("WARNING: Could not find exact old_db_grading in display_client.py!")

open(py_path, 'w', encoding='utf-8').write(py_txt)
print("Updated display_client.py!")
