"""
ingest_pdf.py
-------------
One-shot ingest for standalone PDFs, professor books, and (via --path) audiobooks.

  python ingest_pdf.py --pdf "path/to/book.pdf" --title "Advanced Cell Biology" --subject "Biology" --author "Prof. Smith"
  python ingest_pdf.py
"""

import argparse
import os
import sys

from ingest_engine import run_oneshot_ingest


def main():
    parser = argparse.ArgumentParser(description="Ingest standalone PDF textbooks / books into GANDHO.")
    parser.add_argument("--pdf", type=str, help="Path to a PDF textbook")
    parser.add_argument("--path", type=str, help="Path to a PDF or audiobook file")
    parser.add_argument("--title", type=str)
    parser.add_argument("--subject", type=str, default="College")
    parser.add_argument("--author", type=str, default="Professor")
    parser.add_argument("--locale", type=str, default=None)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    target = args.pdf or args.path
    if target:
        if not os.path.exists(target):
            print(f"[ERROR] File not found: {target}")
            sys.exit(1)
        kind = "standalone_pdf" if target.lower().endswith(".pdf") else "audiobook"
        sys.exit(run_oneshot_ingest(
            force=args.force, locale=args.locale, path=target, kind=kind,
            title=args.title, subject=args.subject, author=args.author,
        ))
    sys.exit(run_oneshot_ingest(force=args.force, locale=args.locale, subject=args.subject, author=args.author))


if __name__ == "__main__":
    main()
