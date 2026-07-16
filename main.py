import sqlite3
import datetime
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Entry(BaseModel):
    id: int
    subject: str
    hours: int
    date: datetime.date


def init_db():
    conn = sqlite3.connect('entries.db')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            hours INTEGER NOT NULL,
            date DATE NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.get("/entries")
def get_entries():
    conn = sqlite3.connect('entries.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entries order by date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/entries")
def create_entry(entry: Entry):
    conn = sqlite3.connect('entries.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO entries (subject, hours, date) VALUES (?, ?, ?)",
                   (entry.subject, entry.hours, entry.date))
    conn.commit()
    conn.close()
    return {"status": "ok" }