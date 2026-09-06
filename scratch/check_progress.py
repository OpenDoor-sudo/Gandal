import sqlite3

conn = sqlite3.connect("vault.db")
cur = conn.cursor()
try:
    cur.execute("SELECT * FROM student_progress")
    cols = [d[0] for d in cur.description]
    for row in cur.fetchall():
        print("student_progress:", dict(zip(cols, row)))
except Exception as e:
    print("Error student_progress:", e)

try:
    cur.execute("SELECT * FROM lesson_progress")
    cols = [d[0] for d in cur.description]
    for row in cur.fetchall():
        print("lesson_progress:", dict(zip(cols, row)))
except Exception as e:
    print("Error lesson_progress:", e)
