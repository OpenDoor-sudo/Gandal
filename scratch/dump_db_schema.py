import sqlite3

def main():
    conn = sqlite3.connect('vault.db')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cur.fetchall()
    for table_tuple in tables:
        table = table_tuple[0]
        print(f"Table: {table}")
        cur.execute(f"PRAGMA table_info({table})")
        cols = cur.fetchall()
        for col in cols:
            print(f"  Column: {col[1]} ({col[2]})")
        
        # Print first few rows to see data format
        cur.execute(f"SELECT * FROM {table} LIMIT 2")
        rows = cur.fetchall()
        for row in rows:
            print(f"    Row: {row}")
    conn.close()

if __name__ == '__main__':
    main()
