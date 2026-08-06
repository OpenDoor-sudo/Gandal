"""
ingest_pdf.py
-------------
Automated Standalone PDF Textbook Ingestion Tool for Ventuno AI (GANDHO).

Use this script to ingest standalone PDF textbooks (e.g., professor's books) into LanceDB RAG vector store and SQLite vault.db, making them instantly available for:
1. Split-Screen Study Mode ([📚 Espaces d'Étude]) & Textbook Drawer (📖)
2. Grounded Socratic tutoring with ZERO hallucination via search_curriculum RAG
3. Live Screen Sharing & Document PiP

Usage:
  python ingest_pdf.py --pdf "path/to/book.pdf" --title "Book Title" --subject "Biology" --author "Prof. Name"
  OR place PDFs inside 'professor_books/' directory and run:
  python ingest_pdf.py
"""

import os
import sys
import argparse
import json
import shutil
import re
import sqlite3
import pypdf
import lancedb
from sentence_transformers import SentenceTransformer

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
os.chdir(PROJECT_ROOT)

TEXTBOOKS_DIR = os.path.join(PROJECT_ROOT, "textbooks")
LANCEDB_DIR = os.path.join(PROJECT_ROOT, ".lancedb")
SQLITE_DB = os.path.join(PROJECT_ROOT, "vault.db")

os.makedirs(TEXTBOOKS_DIR, exist_ok=True)

def load_embedding_model():
    print("[1/5] Loading SentenceTransformer embedding model ('all-MiniLM-L6-v2')...")
    return SentenceTransformer("all-MiniLM-L6-v2")

def get_lancedb_table():
    print(f"[2/5] Connecting to LanceDB at: {LANCEDB_DIR}")
    db = lancedb.connect(LANCEDB_DIR)
    table_name = "curriculum_video_blocks"
    try:
        return db.open_table(table_name)
    except Exception:
        print(f"[LANCEDB] Creating new table '{table_name}'...")
        dummy_data = [{
            "video_id": "dummy",
            "timestamp": "00:00:00",
            "title": "dummy",
            "transcript_summary": "dummy",
            "keywords": "dummy",
            "vector_payload": "dummy",
            "vector": [0.0] * 384
        }]
        return db.create_table(table_name, data=dummy_data)

def extract_pdf_pages(pdf_path):
    print(f"[3/5] Extracting text from PDF: '{pdf_path}'...")
    reader = pypdf.PdfReader(pdf_path)
    num_pages = len(reader.pages)
    print(f"  -> Found {num_pages} pages in PDF.")
    
    page_records = []
    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        raw_text = page.extract_text() or ""
        clean_text = re.sub(r'\s+', ' ', raw_text).strip()
        if clean_text:
            page_records.append({
                "page_num": page_num,
                "text": clean_text
            })
    return page_records

def process_single_pdf(pdf_path, title=None, subject="College", author="Professor", embed_model=None, table=None):
    filename = os.path.basename(pdf_path)
    base_name, _ = os.path.splitext(filename)
    
    # Generate clean book video_id slug
    book_slug = "book_" + re.sub(r'[^a-zA-Z0-9_]', '_', base_name).lower()[:40]
    book_title = title or base_name.replace("_", " ").title()
    
    # 1. Copy PDF to textbooks/ folder
    dest_pdf_path = os.path.join(TEXTBOOKS_DIR, filename)
    if os.path.abspath(pdf_path) != os.path.abspath(dest_pdf_path):
        shutil.copy2(pdf_path, dest_pdf_path)
        print(f"  -> Copied PDF to textbooks/: '{dest_pdf_path}'")
        
    rel_pdf_path = f"textbooks/{filename}".replace("\\", "/")

    # 2. Extract pages
    pages = extract_pdf_pages(pdf_path)
    if not pages:
        print(f"[WARN] No readable text found in '{pdf_path}'.")
        return False

    # 3. Build vector records for LanceDB
    print(f"[4/5] Computing 384-dim embeddings & indexing into LanceDB...")
    raw_chunks = []
    chunk_meta = []
    sqlite_timestamps = []

    for item in pages:
        p_num = item["page_num"]
        p_text = item["text"]
        
        # Chunk text into ~500 char blocks for high-precision search
        chunk_size = 500
        chunks = [p_text[i:i+chunk_size] for i in range(0, len(p_text), chunk_size)]
        
        for c_idx, chunk in enumerate(chunks):
            ts_label = f"Page {p_num}" if len(chunks) == 1 else f"Page {p_num} (Part {c_idx+1})"
            summary = chunk[:250] + ("..." if len(chunk) > 250 else "")
            
            raw_chunks.append(chunk)
            chunk_meta.append((ts_label, summary, chunk))
            sqlite_timestamps.append((book_slug, ts_label, f"{book_title} - {ts_label}", summary))

    print(f"  -> Batched {len(raw_chunks)} text chunks across {len(pages)} pages. Encoding embeddings...")
    embeddings = embed_model.encode(raw_chunks, batch_size=64, show_progress_bar=False)

    lancedb_records = []
    for idx, (ts_label, summary, chunk) in enumerate(chunk_meta):
        lancedb_records.append({
            "video_id": book_slug,
            "timestamp": ts_label,
            "title": f"{book_title} - {ts_label}",
            "transcript_summary": summary,
            "keywords": f"{book_title} {subject} {author} {ts_label}",
            "vector_payload": chunk,
            "vector": embeddings[idx].tolist()
        })

    # Add to LanceDB
    try:
        table.add(lancedb_records)
        print(f"  [LANCEDB SUCCESS] Inserted {len(lancedb_records)} vector chunks into LanceDB.")
    except Exception as e:
        print(f"  [LANCEDB ERROR] LanceDB insert failed: {e}")
        return False

    # 4. Register in SQLite vault.db
    print(f"[5/5] Registering book metadata & savant entry in SQLite vault.db...")
    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        
        # Insert into curriculum_tree
        cursor.execute("""
            INSERT OR REPLACE INTO curriculum_tree (video_id, chapter_id, title, unlocked)
            VALUES (?, ?, ?, 1);
        """, (book_slug, f"ch_{book_slug}", book_title))

        # Insert into lesson_metadata
        cursor.execute("""
            INSERT OR REPLACE INTO lesson_metadata (video_id, chapter_id, pdf_file_path, start_page, instructor_id)
            VALUES (?, ?, ?, 1, 'prof_author');
        """, (book_slug, f"ch_{book_slug}", rel_pdf_path))

        # Insert into instructors
        cursor.execute("""
            INSERT OR REPLACE INTO instructors (instructor_id, full_name, experience_years, subjects_list, profile_image, biography, locale)
            VALUES (?, ?, 10, ?, 'assets/prof_avatar.png', ?, 'en_US');
        """, ("prof_author", author, subject, f"Professor of {subject}"))

        # Clear and insert video_timestamps
        cursor.execute("DELETE FROM video_timestamps WHERE video_id = ?", (book_slug,))
        for ts_row in sqlite_timestamps:
            cursor.execute("""
                INSERT INTO video_timestamps (video_id, timestamp, title, description)
                VALUES (?, ?, ?, ?);
            """, ts_row)

        # Register in savant_matrix
        cursor.execute("""
            INSERT OR REPLACE INTO savant_matrix 
            (video_id, subject, savant, era_context, historical_bio, interdisciplinary_connections, real_world_applications)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (
            book_slug,
            subject,
            f"{author} (Author & College Professor)",
            "Contemporary Academic Publication",
            f"Written by Professor {author}, presenting core academic fundamentals and research in {subject}.",
            f"Connects to advanced coursework in {subject}, cross-disciplinary research, and Socratic analysis.",
            f"Applied directly in university research, academic coursework, and industry practices in {subject}."
        ))

        conn.commit()
        conn.close()
        print(f"  [SQLITE SUCCESS] Book '{book_title}' successfully registered in vault.db!")
    except Exception as sq_err:
        print(f"  [SQLITE ERROR] SQLite registration failed: {sq_err}")
        return False

    # Also update custom_books.json so the Book Drawer renders it immediately
    try:
        books_file = os.path.join(PROJECT_ROOT, "custom_books.json")
        custom_books = []
        if os.path.exists(books_file):
            try:
                with open(books_file, "r", encoding="utf-8") as bf:
                    custom_books = json.load(bf)
            except Exception:
                pass
        
        existing_paths = [b.get("path") for b in custom_books]
        if ("/" + rel_pdf_path) not in existing_paths and rel_pdf_path not in existing_paths:
            custom_books.append({
                "id": book_slug,
                "name": book_title,
                "path": "/" + rel_pdf_path,
                "subject": subject,
                "type": "pdf"
            })
            with open(books_file, "w", encoding="utf-8") as bf:
                json.dump(custom_books, bf, indent=2)
            print(f"  [CUSTOM BOOKS] Added '{book_title}' to custom_books.json")
    except Exception as cb_err:
        print(f"  [CUSTOM BOOKS WARN] Failed to update custom_books.json: {cb_err}")

    print(f"\n✅ SUCCESS: Book '{book_title}' is fully ingested and ready for Socratic tutoring!")
    print(f"   Book ID: '{book_slug}'")
    print(f"   PDF Path: '{rel_pdf_path}'")
    return True

def main():
    parser = argparse.ArgumentParser(description="Ingest standalone PDF textbooks into GANDHO Socratic Tutor system.")
    parser.add_argument("--pdf", type=str, help="Path to PDF textbook file")
    parser.add_argument("--title", type=str, help="Book title")
    parser.add_argument("--subject", type=str, default="College", help="Subject / Category (e.g. Biology, Chemistry, Philosophy)")
    parser.add_argument("--author", type=str, default="Professor", help="Author name")
    
    args = parser.parse_args()

    embed_model = load_embedding_model()
    table = get_lancedb_table()

    if args.pdf:
        if not os.path.exists(args.pdf):
            print(f"[ERROR] Specified PDF file not found: '{args.pdf}'")
            sys.exit(1)
        process_single_pdf(args.pdf, args.title, args.subject, args.author, embed_model, table)
    else:
        # Check 'professor_books' directory
        prof_dir = os.path.join(PROJECT_ROOT, "professor_books")
        os.makedirs(prof_dir, exist_ok=True)
        pdf_files = [os.path.join(prof_dir, f) for f in os.listdir(prof_dir) if f.lower().endswith(".pdf")]
        
        if not pdf_files:
            print("\n[INFO] No PDF specified via --pdf, and no PDF files found in 'professor_books/' folder.")
            print("\nTo ingest a professor's book, either run:")
            print("  python ingest_pdf.py --pdf \"C:/path/to/book.pdf\" --title \"Cell Biology\" --author \"Prof. Smith\"")
            print("OR place your PDF files inside the 'professor_books/' directory and run:")
            print("  python ingest_pdf.py\n")
            return
            
        print(f"\n[INFO] Found {len(pdf_files)} PDF file(s) in 'professor_books/' folder. Ingesting all...")
        for pdf_f in pdf_files:
            process_single_pdf(pdf_f, subject=args.subject, author=args.author, embed_model=embed_model, table=table)

if __name__ == "__main__":
    main()
