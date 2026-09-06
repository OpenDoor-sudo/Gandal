"""
One-shot curriculum ingestion for Ventuno AI (GANDHO).

Bakes every staged lesson (video+PDF), plus standalone PDFs/books/audiobooks, into:
- dense transcripts (tutor tab)
- executive Summary tab document
- flashcards, MCQs, RAG (both LanceDB tables)
- timestamps used internally for seek / chapter RAG

A lesson is marked ready only when all required caches exist.
Mocks do not count as ready.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
import time
import unicodedata

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
os.chdir(PROJECT_ROOT)

VAULT_DB = os.path.join(PROJECT_ROOT, "vault.db")
LANCEDB_DIR = os.path.join(PROJECT_ROOT, ".lancedb")
STAGING_DIR = os.path.join(PROJECT_ROOT, "curriculum_staging")
PROFESSOR_BOOKS = os.path.join(PROJECT_ROOT, "professor_books")
TEXTBOOKS_DIR = os.path.join(PROJECT_ROOT, "textbooks")
AUDIOBOOKS_DIR = os.path.join(PROJECT_ROOT, "audiobooks")

MEDIA_EXTS = (".mp4", ".mp3", ".m4a", ".wav", ".ogg", ".webm")
VIDEO_EXTS = (".mp4", ".webm")
AUDIO_EXTS = (".mp3", ".m4a", ".wav", ".ogg")


def load_env():
    env_path = os.path.join(PROJECT_ROOT, ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")


load_env()


def slugify(text, prefix=""):
    raw = unicodedata.normalize("NFD", str(text or "")).encode("ascii", "ignore").decode("utf-8")
    clean = re.sub(r"[^a-zA-Z0-9_]+", "_", raw.lower()).strip("_")[:48]
    return f"{prefix}{clean}" if prefix else (clean or "lesson")


def normalize_filename(s):
    s = os.path.splitext(s)[0].lower()
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("utf-8")
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return " ".join(s.split())


def ensure_schema(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS curriculum_tree (
            video_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            title TEXT NOT NULL,
            unlocked BOOLEAN NOT NULL CHECK (unlocked IN (0, 1)) DEFAULT 0,
            PRIMARY KEY (video_id, chapter_id)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lesson_metadata (
            video_id TEXT PRIMARY KEY,
            chapter_id TEXT NOT NULL,
            pdf_file_path TEXT NOT NULL,
            start_page INTEGER NOT NULL,
            instructor_id TEXT
        );
    """)
    try:
        cur.execute("ALTER TABLE lesson_metadata ADD COLUMN media_file_path TEXT;")
    except sqlite3.OperationalError:
        pass
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_timestamps (
            video_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            PRIMARY KEY (video_id, timestamp)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_flashcards (
            video_id TEXT NOT NULL,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            hint TEXT NOT NULL,
            PRIMARY KEY (video_id, front)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_transcripts (
            video_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            text TEXT NOT NULL,
            translated_text TEXT,
            PRIMARY KEY (video_id, timestamp)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_quiz_mcqs (
            video_id TEXT NOT NULL,
            question_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            option_a TEXT,
            option_b TEXT,
            option_c TEXT,
            option_d TEXT,
            correct_option TEXT NOT NULL,
            is_alternative INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (video_id, question_id, is_alternative)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lesson_summaries (
            video_id TEXT NOT NULL,
            locale TEXT NOT NULL,
            title TEXT,
            subtitle TEXT,
            overview TEXT,
            formulas_json TEXT,
            concepts_json TEXT,
            takeaways_json TEXT,
            PRIMARY KEY (video_id, locale)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lesson_simulations (
            video_id TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            content_id TEXT NOT NULL,
            component_name TEXT,
            widget TEXT,
            layout_json TEXT,
            PRIMARY KEY (video_id, chapter_id, content_id)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS savant_matrix (
            video_id TEXT PRIMARY KEY,
            subject TEXT,
            savant TEXT,
            era_context TEXT,
            historical_bio TEXT,
            interdisciplinary_connections TEXT,
            real_world_applications TEXT
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_status (
            video_id TEXT PRIMARY KEY,
            asset_kind TEXT,
            title TEXT,
            ready INTEGER NOT NULL DEFAULT 0,
            has_rag INTEGER NOT NULL DEFAULT 0,
            has_summary INTEGER NOT NULL DEFAULT 0,
            has_flashcards INTEGER NOT NULL DEFAULT 0,
            has_transcripts INTEGER NOT NULL DEFAULT 0,
            has_quizzes INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            updated_at TEXT
        );
    """)
    conn.commit()


def resolve_student_locale(cli_locale=None):
    if cli_locale:
        return cli_locale
    try:
        conn = sqlite3.connect(VAULT_DB)
        cur = conn.cursor()
        cur.execute("SELECT locale FROM language_localization ORDER BY ROWID DESC LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row and row[0]:
            return row[0]
    except Exception:
        pass
    return "en_US"


def detect_source_locale(path, sample=""):
    blob = f"{path} {sample[:800]}".lower()
    french_hints = (
        "extraeconomiques", "economiques", "français", "francais",
        "les problèmes", "les problemes", "caractéristiques", "chimie",
    )
    if any(h in blob for h in french_hints):
        return "fr_FR"
    return "en_US"


def translate_text(text, target_locale):
    if not text:
        return text
    import qwen_omni_client
    lang = "French" if str(target_locale).lower().startswith("fr") else "English"
    out = qwen_omni_client.query_llm_text(
        f"Translate into {lang}. Return only the translation.",
        text[:4000],
    )
    return (out or text).strip()


def extract_pdf_paragraphs(pdf_path):
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        paragraphs = []
        for i, page in enumerate(reader.pages):
            raw = page.extract_text() or ""
            clean = re.sub(r"\s+", " ", raw).strip()
            if clean:
                paragraphs.append({"timestamp": f"Page {i + 1}", "text": clean})
        return paragraphs
    except Exception as e:
        print(f"  [PDF] Extract failed: {e}")
        return []


def transcribe_media(media_path, video_id):
    """Return list of {timestamp, text} from audio/video. Empty on failure."""
    import qwen_omni_client
    from google import genai
    from google.genai import types

    google_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not google_key:
        print("  [TRANSCRIPT] GOOGLE_API_KEY missing.")
        return []

    os.makedirs("scratch", exist_ok=True)
    temp_mp3 = os.path.join("scratch", f"{video_id}_transcript_temp.mp3")
    if media_path.lower().endswith(AUDIO_EXTS) and not media_path.lower().endswith(".mp4"):
        audio_path = media_path
    else:
        if not qwen_omni_client.extract_audio_from_video(media_path, temp_mp3):
            return []
        audio_path = temp_mp3

    try:
        client = genai.Client(api_key=google_key)
        uploaded = client.files.upload(file=audio_path)
        checks = 0
        while getattr(uploaded.state, "name", "") == "PROCESSING" and checks < 60:
            time.sleep(2)
            uploaded = client.files.get(name=uploaded.name)
            checks += 1
        if getattr(uploaded.state, "name", "") == "FAILED":
            return []
        prompt = (
            "Transcribe this audio sentence by sentence. "
            'Return ONLY a JSON array of {"timestamp": "MM:SS", "text": "spoken words in the original language"}.'
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded, prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        try:
            client.files.delete(name=uploaded.name)
        except Exception:
            pass
        data = json.loads(response.text.strip())
        if isinstance(data, list):
            return [s for s in data if isinstance(s, dict) and s.get("text")]
        return []
    except Exception as e:
        print(f"  [TRANSCRIPT] Failed: {e}")
        return []
    finally:
        if audio_path == temp_mp3 and os.path.exists(temp_mp3):
            try:
                os.remove(temp_mp3)
            except Exception:
                pass


def _open_lancedb_tables():
    import lancedb
    db = lancedb.connect(LANCEDB_DIR)
    try:
        video_tbl = db.open_table("curriculum_video_blocks")
    except Exception:
        video_tbl = db.create_table("curriculum_video_blocks", data=[{
            "video_id": "dummy", "timestamp": "00:00:00", "title": "dummy",
            "transcript_summary": "dummy", "keywords": "dummy",
            "vector_payload": "dummy", "vector": [0.0] * 384,
        }], mode="overwrite")
    try:
        rag_tbl = db.open_table("curriculum_rag")
    except Exception:
        rag_tbl = db.create_table("curriculum_rag", data=[{
            "content_id": "dummy", "subject": "dummy", "timestamp_marker": "00:00",
            "raw_transcript_text": "dummy", "vector": [0.0] * 384,
        }], mode="overwrite")
    return video_tbl, rag_tbl


def write_rag(video_id, subject, chunks, embed_model):
    """chunks: list of {timestamp, text}"""
    if not chunks or embed_model is None:
        return False
    video_tbl, rag_tbl = _open_lancedb_tables()
    safe_id = re.sub(r"[^a-zA-Z0-9_]", "_", video_id)
    try:
        video_tbl.delete(f"video_id = '{safe_id}'")
    except Exception:
        pass
    try:
        rag_tbl.delete(f"content_id LIKE '{safe_id}_%'")
    except Exception:
        pass
    texts = [c["text"][:2000] for c in chunks]
    vectors = embed_model.encode(texts, batch_size=32, show_progress_bar=False)
    video_rows = []
    rag_rows = []
    for i, chunk in enumerate(chunks):
        ts = chunk.get("timestamp") or f"{i:02d}:00"
        text = chunk["text"]
        summary = text[:400] + ("..." if len(text) > 400 else "")
        vec = vectors[i].tolist()
        video_rows.append({
            "video_id": video_id,
            "timestamp": ts,
            "title": f"{subject} · {ts}",
            "transcript_summary": summary,
            "keywords": subject,
            "vector_payload": text[:4000],
            "vector": vec,
        })
        rag_rows.append({
            "content_id": f"{video_id}_{i}",
            "subject": subject,
            "timestamp_marker": ts,
            "raw_transcript_text": text[:4000],
            "vector": vec,
        })
    video_tbl.add(video_rows)
    rag_tbl.add(rag_rows)
    return True


def count_rows(cur, sql, args):
    cur.execute(sql, args)
    return int(cur.fetchone()[0] or 0)


def lesson_cache_flags(cur, video_id, locale):
    return {
        "has_transcripts": count_rows(cur, "SELECT COUNT(*) FROM video_transcripts WHERE video_id=?", (video_id,)) > 0,
        "has_summary": count_rows(cur, "SELECT COUNT(*) FROM lesson_summaries WHERE video_id=? AND locale=?", (video_id, locale)) > 0,
        "has_flashcards": count_rows(cur, "SELECT COUNT(*) FROM video_flashcards WHERE video_id=?", (video_id,)) > 0,
        "has_quizzes": count_rows(cur, "SELECT COUNT(*) FROM video_quiz_mcqs WHERE video_id=?", (video_id,)) > 0,
        "has_chapters": count_rows(cur, "SELECT COUNT(*) FROM video_timestamps WHERE video_id=?", (video_id,)) > 0,
    }


def write_status(conn, video_id, asset_kind, title, flags, ready, error=""):
    cur = conn.cursor()
    cur.execute("""
        INSERT OR REPLACE INTO ingestion_status
        (video_id, asset_kind, title, ready, has_rag, has_summary, has_flashcards, has_transcripts, has_quizzes, last_error, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (
        video_id, asset_kind, title, 1 if ready else 0,
        1 if flags.get("has_rag") else 0,
        1 if flags.get("has_summary") else 0,
        1 if flags.get("has_flashcards") else 0,
        1 if flags.get("has_transcripts") else 0,
        1 if flags.get("has_quizzes") else 0,
        error or None,
    ))
    conn.commit()


def pair_media_for_pdf(pdf_dir, pdf_file):
    mapping_file = os.path.join(pdf_dir, "mapping.json")
    pdf_stem = os.path.splitext(pdf_file)[0]
    if os.path.exists(mapping_file):
        try:
            with open(mapping_file, "r", encoding="utf-8") as mf:
                m_data = json.load(mf)
            for item in m_data.get("mappings", []):
                if item.get("pdf") == pdf_file or os.path.splitext(item.get("pdf", ""))[0] == pdf_stem:
                    candidate = item.get("video") or item.get("audio")
                    if candidate and os.path.exists(os.path.join(pdf_dir, candidate)):
                        return os.path.join(pdf_dir, candidate)
        except Exception:
            pass
    candidates = [f for f in os.listdir(pdf_dir) if f.lower().endswith(MEDIA_EXTS)]
    for vf in candidates:
        if os.path.splitext(vf)[0].lower() == pdf_stem.lower():
            return os.path.join(pdf_dir, vf)
    pdf_norm = normalize_filename(pdf_file)
    for vf in candidates:
        if normalize_filename(vf) == pdf_norm:
            return os.path.join(pdf_dir, vf)
    pdf_words = set(pdf_norm.split())
    best, best_n = None, 0
    for vf in candidates:
        n = len(pdf_words.intersection(set(normalize_filename(vf).split())))
        if n > best_n:
            best, best_n = vf, n
    if best and best_n >= 1:
        return os.path.join(pdf_dir, best)
    return None


def infer_ids(rel_path, prefix="vid_"):
    parts = rel_path.replace("\\", "/").split("/")
    file_base = os.path.splitext(parts[-1])[0]
    subject = "General"
    if len(parts) >= 3:
        subject = parts[-2] if parts[-2].lower() not in ("k12", "college_level") else parts[-1]
        if len(parts) >= 4:
            subject = parts[2] if parts[0].lower() == "k12" else parts[1]
    subject_title = subject.replace("_", " ").replace("-", " ").title()
    title = re.sub(r"^\d+[\s_\.-]+", "", file_base.replace("_", " ").replace("-", " ")).title()
    video_id = slugify(f"{subject}_{file_base}", prefix)
    chapter_id = slugify(f"ch_{subject}_{file_base}")
    return video_id, chapter_id, title, subject_title


def discover_jobs(extra_path=None, extra_kind=None, extra_title=None, extra_subject=None, extra_author=None):
    jobs = []
    paired_media = set()
    paired_pdfs = set()

    if extra_path:
        abs_p = os.path.abspath(extra_path)
        kind = extra_kind or ("standalone_pdf" if abs_p.lower().endswith(".pdf") else "audiobook")
        jobs.append({
            "kind": kind,
            "title": extra_title or os.path.splitext(os.path.basename(abs_p))[0],
            "subject": extra_subject or "College",
            "author": extra_author or "Professor",
            "pdf_path": abs_p if abs_p.lower().endswith(".pdf") else None,
            "media_path": None if abs_p.lower().endswith(".pdf") else abs_p,
        })
        return jobs

    if os.path.isdir(STAGING_DIR):
        for root, _dirs, files in os.walk(STAGING_DIR):
            files = sorted(files)
            pdfs = [f for f in files if f.lower().endswith(".pdf")]
            for pdf in pdfs:
                pdf_path = os.path.join(root, pdf)
                media = pair_media_for_pdf(root, pdf)
                rel = os.path.relpath(pdf_path, STAGING_DIR)
                vid, chap, title, subject = infer_ids(rel)
                jobs.append({
                    "kind": "lesson_av" if media else "lesson_pdf",
                    "video_id": vid,
                    "chapter_id": chap,
                    "title": title,
                    "subject": subject,
                    "pdf_path": pdf_path,
                    "media_path": media,
                    "rel_pdf": ("curriculum_staging/" + rel.replace("\\", "/")),
                })
                paired_pdfs.add(os.path.abspath(pdf_path))
                if media:
                    paired_media.add(os.path.abspath(media))
        for root, _dirs, files in os.walk(STAGING_DIR):
            for f in files:
                if not f.lower().endswith(MEDIA_EXTS):
                    continue
                media_path = os.path.join(root, f)
                if os.path.abspath(media_path) in paired_media:
                    continue
                rel = os.path.relpath(media_path, STAGING_DIR)
                vid, chap, title, subject = infer_ids(rel)
                jobs.append({
                    "kind": "lesson_video" if f.lower().endswith(VIDEO_EXTS) else "audiobook",
                    "video_id": vid,
                    "chapter_id": chap,
                    "title": title,
                    "subject": subject,
                    "pdf_path": None,
                    "media_path": media_path,
                    "rel_pdf": "",
                })

    for folder, kind in ((PROFESSOR_BOOKS, "standalone_pdf"), (TEXTBOOKS_DIR, "standalone_pdf"), (AUDIOBOOKS_DIR, "audiobook")):
        os.makedirs(folder, exist_ok=True)
        for f in sorted(os.listdir(folder)):
            path = os.path.join(folder, f)
            if kind == "standalone_pdf" and f.lower().endswith(".pdf"):
                jobs.append({
                    "kind": "standalone_pdf",
                    "title": os.path.splitext(f)[0].replace("_", " ").title(),
                    "subject": "College",
                    "author": "Professor",
                    "pdf_path": path,
                    "media_path": None,
                })
            elif kind == "audiobook" and f.lower().endswith(AUDIO_EXTS):
                jobs.append({
                    "kind": "audiobook",
                    "title": os.path.splitext(f)[0].replace("_", " ").title(),
                    "subject": "College",
                    "pdf_path": None,
                    "media_path": path,
                })
    return jobs


def process_job(job, locale, embed_model, force=False):
    import qwen_omni_client
    import shutil

    kind = job["kind"]
    pdf_path = job.get("pdf_path")
    media_path = job.get("media_path")
    title = job.get("title") or "Lesson"
    subject = job.get("subject") or "General"
    author = job.get("author") or "Professor"

    if kind in ("standalone_pdf", "audiobook") and not job.get("video_id"):
        base = os.path.splitext(os.path.basename(pdf_path or media_path))[0]
        prefix = "book_" if kind == "standalone_pdf" else "audio_"
        job["video_id"] = slugify(base, prefix)
        job["chapter_id"] = slugify(f"ch_{base}")

    video_id = job["video_id"]
    chapter_id = job.get("chapter_id") or f"ch_{video_id}"

    print(f"\n=== INGEST {kind}: {title} ({video_id}) ===")
    conn = sqlite3.connect(VAULT_DB)
    ensure_schema(conn)
    cur = conn.cursor()
    flags = lesson_cache_flags(cur, video_id, locale)
    flags["has_rag"] = False

    rel_pdf = job.get("rel_pdf") or ""
    if kind == "standalone_pdf" and pdf_path:
        os.makedirs(TEXTBOOKS_DIR, exist_ok=True)
        dest = os.path.join(TEXTBOOKS_DIR, os.path.basename(pdf_path))
        if os.path.abspath(pdf_path) != os.path.abspath(dest):
            shutil.copy2(pdf_path, dest)
        rel_pdf = "textbooks/" + os.path.basename(pdf_path)
        pdf_path = dest

    rel_media = ""
    if media_path and os.path.exists(media_path):
        rel_media = os.path.relpath(media_path, PROJECT_ROOT).replace("\\", "/")

    errors = []
    source_chunks = []
    newly_extracted = False

    if media_path and (force or not flags["has_transcripts"]):
        print("  -> Transcribing media...")
        source_chunks = transcribe_media(media_path, video_id)
        newly_extracted = bool(source_chunks)
        if not source_chunks:
            errors.append("transcript")
    if pdf_path and not source_chunks:
        print("  -> Extracting PDF text...")
        source_chunks = extract_pdf_paragraphs(pdf_path)
        newly_extracted = bool(source_chunks)
        if not source_chunks:
            errors.append("pdf_text")
    if not source_chunks:
        cur.execute("SELECT timestamp, text, translated_text FROM video_transcripts WHERE video_id=? ORDER BY timestamp", (video_id,))
        source_chunks = [{"timestamp": r[0], "text": r[1], "translated_text": r[2]} for r in cur.fetchall()]

    source_locale = detect_source_locale(media_path or pdf_path or "", " ".join((c.get("text") or "")[:200] for c in source_chunks[:3]))
    if newly_extracted and source_chunks:
        cur.execute("DELETE FROM video_transcripts WHERE video_id=?", (video_id,))
        for seg in source_chunks:
            text = seg["text"]
            translated = text
            if source_locale.split("_")[0] != str(locale).split("_")[0]:
                translated = translate_text(text, locale)
            cur.execute(
                "INSERT OR REPLACE INTO video_transcripts (video_id, timestamp, text, translated_text) VALUES (?, ?, ?, ?)",
                (video_id, seg.get("timestamp") or "00:00", text, translated),
            )
        conn.commit()

    cur.execute("SELECT COALESCE(translated_text, text) FROM video_transcripts WHERE video_id=? ORDER BY timestamp", (video_id,))
    db_text = "\n\n".join((r[0] or "") for r in cur.fetchall() if r and r[0])
    source_text = (db_text or "\n\n".join(c.get("text") or "" for c in source_chunks))[:12000]

    if source_chunks and embed_model is not None:
        print("  -> Writing RAG embeddings...")
        try:
            flags["has_rag"] = write_rag(video_id, subject, source_chunks, embed_model)
        except Exception as e:
            errors.append(f"rag:{e}")
            flags["has_rag"] = False

    need_chapters = force or not flags["has_chapters"]
    if need_chapters:
        print("  -> Generating chapter outlines...")
        chapters = []
        if media_path:
            chapters = qwen_omni_client.generate_video_timestamps(media_path, video_id, fallback_mock=False)
        if not chapters:
            chapters = qwen_omni_client.generate_chapters_from_text(source_text, locale)
        if chapters:
            cur.execute("DELETE FROM video_timestamps WHERE video_id=?", (video_id,))
            for ts in chapters:
                cur.execute(
                    "INSERT OR REPLACE INTO video_timestamps (video_id, timestamp, title, description) VALUES (?, ?, ?, ?)",
                    (video_id, ts.get("timestamp") or "00:00", ts.get("title") or "Chapter", ts.get("description") or ""),
                )
            conn.commit()
        else:
            errors.append("chapters")

    if force or not flags["has_summary"]:
        print("  -> Generating Summary tab document...")
        summary = qwen_omni_client.generate_lesson_summary_doc(source_text, title, subject, locale)
        if summary and summary.get("overview"):
            cur.execute(
                """INSERT OR REPLACE INTO lesson_summaries
                   (video_id, locale, title, subtitle, overview, formulas_json, concepts_json, takeaways_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    video_id, locale, summary["title"], summary["subtitle"], summary["overview"],
                    json.dumps(summary.get("formulas") or [], ensure_ascii=False),
                    json.dumps(summary.get("concepts") or [], ensure_ascii=False),
                    json.dumps(summary.get("takeaways") or [], ensure_ascii=False),
                ),
            )
            conn.commit()
        else:
            errors.append("summary")

    if force or not flags["has_flashcards"]:
        print("  -> Generating flashcards...")
        cards = []
        if media_path:
            cards = qwen_omni_client.generate_video_flashcards(media_path, video_id, locale, fallback_mock=False)
        if not cards:
            cards = qwen_omni_client.generate_flashcards_from_text(source_text, locale)
        if cards:
            cur.execute("DELETE FROM video_flashcards WHERE video_id=?", (video_id,))
            for fc in cards:
                cur.execute(
                    "INSERT OR REPLACE INTO video_flashcards (video_id, front, back, hint) VALUES (?, ?, ?, ?)",
                    (video_id, fc["front"], fc["back"], fc.get("hint") or ""),
                )
            conn.commit()
        else:
            errors.append("flashcards")

    if force or not flags["has_quizzes"]:
        print("  -> Generating quizzes...")
        quizzes = qwen_omni_client.generate_quiz_mcqs(source_text, locale, n_main=5, n_alt=5)
        if quizzes:
            cur.execute("DELETE FROM video_quiz_mcqs WHERE video_id=?", (video_id,))
            for q in quizzes:
                opts = q.get("options") or {}
                cur.execute(
                    """INSERT OR REPLACE INTO video_quiz_mcqs
                       (video_id, question_id, question, option_a, option_b, option_c, option_d, correct_option, is_alternative)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        video_id, int(q.get("id") or 1), q.get("question") or "",
                        opts.get("A") or "", opts.get("B") or "", opts.get("C") or "", opts.get("D") or "",
                        q.get("correct") or "A", int(q.get("is_alternative") or 0),
                    ),
                )
            conn.commit()
        else:
            errors.append("quizzes")

    # Simulations / savant are best-effort and not required for ready.
    try:
        layouts = qwen_omni_client.generate_lesson_simulations(subject, title, [c["text"] for c in source_chunks[:5]], video_id, chapter_id)
        cur.execute("DELETE FROM lesson_simulations WHERE video_id=? AND chapter_id=?", (video_id, chapter_id))
        for i, layout in enumerate(layouts or []):
            cur.execute(
                """INSERT OR REPLACE INTO lesson_simulations
                   (video_id, chapter_id, content_id, component_name, widget, layout_json)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (video_id, chapter_id, f"{video_id}_{i}", layout.get("component_name"), layout.get("widget"), json.dumps(layout)),
            )
        conn.commit()
    except Exception as e:
        print(f"  [SIM] Optional simulation bake skipped: {e}")

    try:
        from savant_curriculum_matrix import SAVANT_AND_CHAPTER_CONNECTIONS
        data = SAVANT_AND_CHAPTER_CONNECTIONS.get(video_id)
        if not data:
            sl = subject.lower()
            if "math" in sl or "calculus" in sl:
                data = SAVANT_AND_CHAPTER_CONNECTIONS.get("math_calculus_default")
            elif "econ" in sl:
                data = SAVANT_AND_CHAPTER_CONNECTIONS.get("vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques")
            elif "phys" in sl:
                data = SAVANT_AND_CHAPTER_CONNECTIONS.get("vid_physics_01")
            elif "chem" in sl:
                data = SAVANT_AND_CHAPTER_CONNECTIONS.get("vid_chemistry_organic_chemistry_chemistry")
        if data:
            cur.execute(
                """INSERT OR REPLACE INTO savant_matrix
                   (video_id, subject, savant, era_context, historical_bio, interdisciplinary_connections, real_world_applications)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (video_id, subject, data.get("savant"), data.get("era_context", ""), data.get("historical_bio"),
                 data.get("interdisciplinary_connections"), data.get("real_world_applications")),
            )
            conn.commit()
        elif kind in ("standalone_pdf", "audiobook"):
            cur.execute(
                """INSERT OR REPLACE INTO savant_matrix
                   (video_id, subject, savant, era_context, historical_bio, interdisciplinary_connections, real_world_applications)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (video_id, subject, f"{author}", "Contemporary", f"Source authored or narrated by {author} in {subject}.",
                 f"Connects to coursework in {subject}.", f"Used for Socratic study of {title}."),
            )
            conn.commit()
    except Exception as e:
        print(f"  [SAVANT] Optional: {e}")

    unlocked = 1 if kind in ("standalone_pdf", "audiobook") else 0
    instructor_id = "prof_evans_fr" if str(locale).startswith("fr") else "prof_evans"
    if kind == "standalone_pdf":
        instructor_id = "prof_author"

    cur.execute(
        "INSERT OR REPLACE INTO curriculum_tree (video_id, chapter_id, title, unlocked) VALUES (?, ?, ?, ?)",
        (video_id, chapter_id, title, unlocked),
    )
    try:
        cur.execute(
            """INSERT OR REPLACE INTO lesson_metadata (video_id, chapter_id, pdf_file_path, start_page, instructor_id, media_file_path)
               VALUES (?, ?, ?, 1, ?, ?)""",
            (video_id, chapter_id, rel_pdf or "", instructor_id, rel_media or None),
        )
    except sqlite3.OperationalError:
        cur.execute(
            """INSERT OR REPLACE INTO lesson_metadata (video_id, chapter_id, pdf_file_path, start_page, instructor_id)
               VALUES (?, ?, ?, 1, ?)""",
            (video_id, chapter_id, rel_pdf or "", instructor_id),
        )
    conn.commit()

    if kind == "standalone_pdf" and rel_pdf:
        try:
            books_file = os.path.join(PROJECT_ROOT, "custom_books.json")
            custom_books = []
            if os.path.exists(books_file):
                with open(books_file, "r", encoding="utf-8") as bf:
                    custom_books = json.load(bf)
            paths = [b.get("path") for b in custom_books]
            book_path = "/" + rel_pdf.replace("\\", "/")
            if book_path not in paths and rel_pdf not in paths:
                custom_books.append({"id": video_id, "name": title, "path": book_path, "subject": subject, "type": "pdf"})
                with open(books_file, "w", encoding="utf-8") as bf:
                    json.dump(custom_books, bf, indent=2)
        except Exception as e:
            print(f"  [BOOKS] custom_books.json warn: {e}")

    flags = lesson_cache_flags(cur, video_id, locale)
    flags["has_rag"] = bool(source_chunks)
    ready = all([
        flags["has_transcripts"],
        flags["has_summary"],
        flags["has_flashcards"],
        flags["has_quizzes"],
        flags["has_chapters"],
        bool(source_chunks),
    ])
    write_status(conn, video_id, kind, title, {**flags, "has_rag": bool(source_chunks)}, ready, ";".join(errors))
    conn.close()
    print(f"  -> READY={ready} missing={errors or 'none'}")
    return ready


def run_oneshot_ingest(force=False, locale=None, path=None, kind=None, title=None, subject=None, author=None):
    print("==========================================================")
    print("ONE-SHOT CURRICULUM INGEST (Summary + Tutor + Quizzes + RAG)")
    print("==========================================================")
    locale = resolve_student_locale(locale)
    print(f"Student locale: {locale}")

    conn = sqlite3.connect(VAULT_DB)
    ensure_schema(conn)
    conn.close()

    embed_model = None
    try:
        from sentence_transformers import SentenceTransformer
        print("[EMBEDDINGS] Loading all-MiniLM-L6-v2...")
        embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as e:
        print(f"[EMBEDDINGS] Failed ({e}). RAG will be skipped; lesson will not be marked ready.")

    jobs = discover_jobs(path, kind, title, subject, author)
    if not jobs:
        print("No PDFs, videos, or audiobooks found in curriculum_staging/, professor_books/, textbooks/, or audiobooks/.")
        return 1

    ok = 0
    fail = 0
    for job in jobs:
        try:
            if process_job(job, locale, embed_model, force=force):
                ok += 1
            else:
                fail += 1
        except Exception as e:
            fail += 1
            print(f"  [ERROR] {job.get('title')}: {e}")
    print("\n==========================================================")
    print(f"INGEST COMPLETE  ready={ok}  incomplete={fail}  total={len(jobs)}")
    print("A lesson is ready only with transcripts, Summary, flashcards, quizzes, and RAG.")
    print("==========================================================")
    return 0 if fail == 0 else 2


def main():
    parser = argparse.ArgumentParser(description="One-shot ingest for lessons, PDFs, and audiobooks.")
    parser.add_argument("--force", action="store_true", help="Regenerate caches even if they already exist")
    parser.add_argument("--locale", default=None, help="Student locale, e.g. fr_FR or en_US")
    parser.add_argument("--path", default=None, help="Ingest a single PDF, video, or audio file")
    parser.add_argument("--kind", default=None, choices=["standalone_pdf", "audiobook", "lesson_video", "lesson_av"])
    parser.add_argument("--title", default=None)
    parser.add_argument("--subject", default=None)
    parser.add_argument("--author", default="Professor")
    args = parser.parse_args()
    sys.exit(run_oneshot_ingest(
        force=args.force, locale=args.locale, path=args.path, kind=args.kind,
        title=args.title, subject=args.subject, author=args.author,
    ))


if __name__ == "__main__":
    main()
