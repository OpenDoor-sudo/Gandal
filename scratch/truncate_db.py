import sqlite3

def main():
    conn = sqlite3.connect('vault.db')
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM user_profiles")
        cur.execute("DELETE FROM evaluation_ledger")
        conn.commit()
        print("Successfully truncated user_profiles and evaluation_ledger tables inside vault.db.")
    except Exception as e:
        print(f"Error truncating tables: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    main()
