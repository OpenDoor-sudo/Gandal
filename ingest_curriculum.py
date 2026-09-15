"""
ingest_curriculum.py
--------------------
One-shot bake of staged curriculum (video + PDF), leftover media, and
standalone books/audiobooks. Does not require sentence_transformers.
Does not bake a chapter-timestamp list; the Summary tab is the lesson document.

One command fills transcripts, Summary, flashcards, and quizzes. If some
lessons fail Gemini JSON or a missing package on the first pass, the same
process retries incomplete jobs and writes local fallbacks so you do not
need a second ingest.

  python ingest_curriculum.py
  python ingest_curriculum.py --force --locale fr_FR
  python ingest_curriculum.py --path "path/to/book.pdf" --title "Cell Biology" --author "Prof. Smith"
"""

from ingest_engine import main

if __name__ == "__main__":
    main()
