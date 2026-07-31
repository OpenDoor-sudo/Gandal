import sqlite3

db_path = "c:/Users/lalyb/Desktop/ventuno_ai_testbed/vault.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print("Tables:", tables)
    for table in tables:
        print(f"\nSchema for {table}:")
        cursor.execute(f"PRAGMA table_info({table})")
        for col in cursor.fetchall():
            print("  Col:", col)
        
        print(f"Sample data from {table}:")
        cursor.execute(f"SELECT * FROM {table} LIMIT 5")
        rows = cursor.fetchall()
        for r in rows:
            print("  ", r)
except Exception as e:
    print(f"Error querying schema: {e}")

conn.close()
