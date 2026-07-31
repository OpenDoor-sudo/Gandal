import os, re, json, sqlite3

print("=== STARTING FULL SYSTEM & FEATURE AUDIT ===")

# 1. Inspect index.html
html_txt = open('index.html', 'r', encoding='utf-8').read()

features_check = {
    "loadTextbookPDF": "async function loadTextbookPDF" in html_txt or "function loadTextbookPDF" in html_txt,
    "renderVideoSummary": "function renderVideoSummary" in html_txt,
    "renderQuizQuestions": "function renderQuizQuestions" in html_txt,
    "renderFlashcardsDeck": "function renderFlashcardsDeck" in html_txt,
    "renderKnowledgeCoreGrid": "function renderKnowledgeCoreGrid" in html_txt,
    "renderProfileInterests": "function renderProfileInterests" in html_txt,
    "renderCurriculumTimestamps": "function renderCurriculumTimestamps" in html_txt,
    "loadLibrary": "function loadLibrary" in html_txt or "libraryContent" in html_txt,
    "switchSidebarTab": "function switchSidebarTab" in html_txt,
    "saveVideoProgress": "function saveVideoProgress" in html_txt or "saveVideoProgress(" in html_txt,
    "isRestoringVideoProgress": "isRestoringVideoProgress" in html_txt,
    "KaTeX rendering in Summary": "window.katex.renderToString" in html_txt,
    "Sommaire Tab Button": "Sommaire</button>" in html_txt,
    "Full Path Interests Helper": "getFullPathForInterest" in html_txt,
}

print("\n--- FRONTEND FEATURES AUDIT (index.html) ---")
for feat, status in features_check.items():
    print(f"[{'OK' if status else 'MISSING'}] {feat}")

# 2. Audit Quiz / Evaluation Questions data in index.html
has_econ_quiz = "problèmes démographiques" in html_txt or "explosion démographique" in html_txt
has_chem_quiz = "chlorure" in html_txt or "alkylammonium" in html_txt
print(f"[{'OK' if has_econ_quiz else 'MISSING'}] Economics Evaluation / Quiz Data")
print(f"[{'OK' if has_chem_quiz else 'MISSING'}] Chemistry Evaluation / Quiz Data")

# 3. Audit display_client.py endpoints
py_txt = open('display_client.py', 'r', encoding='utf-8').read()
py_endpoints = {
    "/api/lesson": "/api/lesson" in py_txt,
    "/api/save_progress": "/api/save_progress" in py_txt,
    "/api/books": "/api/books" in py_txt or "/api/lessons" in py_txt,
    "/api/instructors": "/api/instructors" in py_txt,
}

print("\n--- BACKEND ENDPOINTS AUDIT (display_client.py) ---")
for ep, status in py_endpoints.items():
    print(f"[{'OK' if status else 'MISSING'}] {ep}")

# 4. Audit vault.db schema & data
print("\n--- DATABASE AUDIT (vault.db) ---")
if os.path.exists('vault.db'):
    conn = sqlite3.connect('vault.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"[OK] Database tables: {tables}")
    
    cursor.execute("SELECT user_id, background_context FROM user_profiles;")
    profiles = cursor.fetchall()
    print(f"[OK] User profile session state: {profiles}")
    conn.close()

print("\n=== SYSTEM AUDIT COMPLETED ===")
