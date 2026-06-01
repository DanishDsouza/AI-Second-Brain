import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./notes.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_note_analysis_columns() -> None:
    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as connection:
        existing_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(notes)"))
        }
        if not existing_columns:
            return

        columns_to_add = {
            "category": "ALTER TABLE notes ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT ''",
            "tags": "ALTER TABLE notes ADD COLUMN tags JSON NOT NULL DEFAULT '[]'",
            "summary": "ALTER TABLE notes ADD COLUMN summary TEXT NOT NULL DEFAULT ''",
        }

        for column_name, statement in columns_to_add.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))
