import sqlite3

try:
    conn = sqlite3.connect("vault.db")
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='language_localization'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Migrating language_localization table...")
        
        # Disable foreign key checks temporarily during migration
        cursor.execute("PRAGMA foreign_keys = OFF;")
        
        # Rename old table
        cursor.execute("ALTER TABLE language_localization RENAME TO language_localization_old;")
        
        # Create new table with updated CHECK constraint
        cursor.execute("""
            CREATE TABLE language_localization (
                user_id TEXT PRIMARY KEY,
                locale TEXT NOT NULL CHECK (locale IN ('en_US', 'fr_FR', 'zh_CN', 'es_ES', 'pt_PT', 'ar_AE')),
                FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
            );
        """)
        
        # Copy data (ignoring rows that don't match the new check constraint if any, though all should)
        cursor.execute("INSERT OR IGNORE INTO language_localization SELECT * FROM language_localization_old;")
        
        # Drop old table
        cursor.execute("DROP TABLE language_localization_old;")
        
        # Re-enable foreign key checks
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        conn.commit()
        print("Migration COMPLETED successfully!")
    else:
        print("Table language_localization does not exist. No migration needed.")
        
except Exception as e:
    print(f"Migration FAILED: {e}")
finally:
    if conn:
        conn.close()
