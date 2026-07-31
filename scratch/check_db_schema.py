import sqlite3

def check():
    conn = sqlite3.connect('vault.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print('Tables in vault.db:', tables)
    for table in ['mastery_ledger', 'curriculum_tree', 'lesson_metadata', 'instructors']:
        if table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            info = cursor.fetchall()
            print(f"\nSchema of {table}:")
            for col in info:
                print(f"  {col[1]} ({col[2]})")
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Row count: {count}")
            if count > 0:
                cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                print("First 3 rows:")
                for r in cursor.fetchall():
                    print("  ", r)
        else:
            print(f"\nTable '{table}' does not exist.")
    conn.close()

if __name__ == '__main__':
    check()
