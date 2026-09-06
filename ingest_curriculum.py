"""
ingest_curriculum.py
--------------------
One-shot bake of staged curriculum (video + PDF), leftover media, and
standalone books/audiobooks.

  python ingest_curriculum.py
  python ingest_curriculum.py --force --locale fr_FR
  python ingest_curriculum.py --path "path/to/book.pdf" --title "Cell Biology" --author "Prof. Smith"
"""

from ingest_engine import main

if __name__ == "__main__":
    main()
