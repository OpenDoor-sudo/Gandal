import sqlite3

conn = sqlite3.connect('vault.db')
cur = conn.cursor()

tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables in vault.db:", tables)

for t in tables:
    try:
        columns = [c[1] for c in cur.execute(f"PRAGMA table_info({t})").fetchall()]
        rows = cur.execute(f"SELECT * FROM {t}").fetchall()
        print(f"\n--- TABLE: {t} (Columns: {columns}, Total Rows: {len(rows)}) ---")
        mock_count = 0
        for r in rows:
            r_str = str(r)
            if "ONU" in r_str or "Globale" in r_str or "ONU" in r_str or "onusienne" in r_str:
                print("  [MOCK FOUND]:", r)
                mock_count += 1
        print(f"  Total mock rows found in {t}: {mock_count}")
    except Exception as e:
        print(f"Error reading table {t}: {e}")

conn.close()
