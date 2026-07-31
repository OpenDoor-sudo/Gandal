import sqlite3

try:
    conn = sqlite3.connect("vault.db")
    cursor = conn.cursor()
    # Try inserting pt_PT
    cursor.execute("INSERT OR REPLACE INTO user_profiles (user_id, background_context) VALUES ('test_user', 'College')")
    cursor.execute("INSERT OR REPLACE INTO language_localization (user_id, locale) VALUES ('test_user', 'pt_PT')")
    conn.commit()
    print("SUCCESS: Inserted pt_PT successfully!")
except Exception as e:
    print(f"FAILED: {e}")
finally:
    if conn:
        conn.close()
