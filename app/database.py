"""
Datenbank-Setup (SQLite via SQLAlchemy).
Wird beim ersten Start automatisch erstellt.
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from datetime import datetime
from pathlib import Path

# Datenbank liegt immer in data/app.db
DB_PATH = Path(__file__).parent.parent / "data" / "app.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Subject(Base):
    """Ein Fach (z. B. Anatomie) mit Farbe und Abkürzung."""
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")   # Hex-Farbe
    abbreviation = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recordings = relationship("Recording", back_populates="subject", cascade="all, delete")


class Recording(Base):
    """Eine Vorlesungsaufnahme mit zugehörigen Ergebnissen."""
    __tablename__ = "recordings"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String(200), nullable=False)
    filename = Column(String(200), nullable=False)   # Audiodatei in data/audio/
    recorded_at = Column(DateTime, default=datetime.utcnow)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String(30), default="uploaded")  # uploaded | transcribing | analysing | done | error
    transcript_file = Column(String(200), nullable=True)
    summary_file = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)

    subject = relationship("Subject", back_populates="recordings")


def init_db():
    """Erstellt alle Tabellen und legt Standard-Fächer an, falls die DB neu ist."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(Subject).count() == 0:
            defaults = [
                Subject(name="Anatomie",    color="#ef4444", abbreviation="Ana"),
                Subject(name="Physiologie", color="#3b82f6", abbreviation="Phy"),
                Subject(name="Biochemie",   color="#10b981", abbreviation="Bio"),
            ]
            db.add_all(defaults)
            db.commit()
    finally:
        db.close()


def get_db():
    """Dependency für FastAPI-Endpunkte."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
