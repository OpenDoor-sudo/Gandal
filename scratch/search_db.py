import sqlite3

def main():
    conn = sqlite3.connect('vault.db')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cur.fetchall()
    found = False
    for table_tuple in tables:
        table = table_tuple[0]
        try:
            cur.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cur.fetchall()]
            cur.execute(f"SELECT * FROM {table}")
            rows = cur.fetchall()
            for r_idx, row in enumerate(rows):
                for c_idx, val in enumerate(row):
                    if isinstance(val, str) and any(x in val.lower() for x in ['flower', 'sample', 'llm']):
                        print(f"Table {table}, Column {columns[c_idx]}, Row {r_idx}: {val}")
                        found = True
        except Exception as e:
            print(f"Error reading table {table}: {e}")
    if not found:
        print("No occurrences of flower, sample, or llm found in vault.db.")

if __name__ == '__main__':
    main()
