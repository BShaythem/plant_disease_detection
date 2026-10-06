# ml/scripts/scaffold_app_db.py — dev/testing only, not part of the app.
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[2]
conn = sqlite3.connect(root / "ml" / "build" / "app.db")
conn.execute("PRAGMA foreign_keys = ON")
conn.executescript((root / "ml" / "db" / "schema_app.sql").read_text(encoding="utf-8"))
conn.close()
print("Scaffolded empty app.db for local testing")