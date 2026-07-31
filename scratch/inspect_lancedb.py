import lancedb

def inspect_lancedb():
    db = lancedb.connect(".lancedb")
    table = db.open_table("curriculum_rag")
    df = table.to_pandas()
    print("Columns:", list(df.columns))
    print("\nTable rows:")
    print(df)

if __name__ == "__main__":
    inspect_lancedb()
