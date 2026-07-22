import os
from datetime import date as Date

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Legge il file .env e carica il suo contenuto come variabili d'ambiente vere.
# In produzione (FastAPI Cloud) questo non serve — la variabile sarà già impostata
# dalla piattaforma stessa — ma non fa danni tenerlo: se .env non esiste, non fa nulla.
load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
# os.environ[...] (con le parentesi quadre) fa fallire subito il programma con un errore
# chiaro se la variabile manca, invece di scoprirlo più tardi con un errore di connessione
# criptico — preferibile a os.environ.get(...) qui, perché senza DATABASE_URL l'app
# non ha alcun motivo di partire.
API_KEY = os.environ["API_KEY"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TimeEntry(BaseModel):
    subject: str
    hours: float
    date: Date = Field(default_factory=Date.today)


# --- DATABASE ---
# psycopg.connect() invece di sqlite3.connect("file.db"): non ti connetti più
# a un file sul disco, ma a un server Postgres remoto (Neon), usando la connection
# string. Concettualmente stessa idea di prima, cambia solo "dove" vive il database.
def init_db():
    conn = psycopg.connect(DATABASE_URL)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS entries (
            id SERIAL PRIMARY KEY,
            subject TEXT NOT NULL,
            hours REAL NOT NULL,
            date DATE NOT NULL
        )
    """)
    # SERIAL PRIMARY KEY è l'equivalente Postgres di
    # "INTEGER PRIMARY KEY AUTOINCREMENT" in SQLite: stesso comportamento
    # (numero che si auto-incrementa), sintassi diversa.
    conn.commit()
    conn.close()


init_db()


@app.get("/entries")
def get_entries():
    conn = psycopg.connect(DATABASE_URL)
    conn.row_factory = psycopg.rows.dict_row  # equivalente di sqlite3.Row: righe come dict
    rows = conn.execute("SELECT * FROM entries ORDER BY date DESC").fetchall()
    conn.close()
    return rows


@app.get("/entries/summary")
def get_summary():
    conn = psycopg.connect(DATABASE_URL)
    conn.row_factory = psycopg.rows.dict_row
    rows = conn.execute("""
        SELECT subject, SUM(hours) AS total_hours, COUNT(*) AS number_entries
        FROM entries
        GROUP BY subject
        ORDER BY total_hours DESC
    """).fetchall()
    conn.close()
    return rows


@app.post("/entries")
def create_entry(entry: TimeEntry, x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    conn = psycopg.connect(DATABASE_URL)
    conn.execute(
        "INSERT INTO entries (subject, hours, date) VALUES (%s, %s, %s)",
        (entry.subject, entry.hours, entry.date),
    )
    # %s invece di ?: è il placeholder che usa psycopg (driver diverso, sintassi
    # diversa per gli stessi "segnaposto" sicuri contro SQL injection).
    conn.commit()
    conn.close()
    return {"status": "ok"}