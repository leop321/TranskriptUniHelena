"""
FastAPI Hauptanwendung – API-Endpunkte und Seiten-Routing.
"""
from fastapi import FastAPI, Request, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime
from pathlib import Path
import shutil
import uuid

from .database import init_db, get_db, Subject, Recording

# ── Pfade ────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
AUDIO_DIR   = BASE_DIR.parent / "data" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# ── App-Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="TranskriptUniHelena", version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

@app.on_event("startup")
async def startup():
    init_db()

# ── Hilfs-Funktion ────────────────────────────────────────────────────────────
def subject_to_dict(s: Subject) -> dict:
    return {"id": s.id, "name": s.name, "color": s.color, "abbreviation": s.abbreviation or ""}

def recording_to_dict(r: Recording) -> dict:
    return {
        "id": r.id,
        "title": r.title,
        "filename": r.filename,
        "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
        "duration_seconds": r.duration_seconds,
        "status": r.status,
        "subject_id": r.subject_id,
        "subject_color": r.subject.color if r.subject else "#94a3b8",
        "subject_name": r.subject.name if r.subject else "Ohne Fach",
    }

# ─────────────────────────────────────────────────────────────────────────────
#  SEITEN
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def page_index(request: Request, db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    return templates.TemplateResponse("index.html", {
        "request": request,
        "subjects": [subject_to_dict(s) for s in subjects],
    })

@app.get("/summaries", response_class=HTMLResponse)
async def page_summaries(request: Request, db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    data = []
    for s in subjects:
        recs = db.query(Recording).filter(Recording.subject_id == s.id)\
                 .order_by(Recording.recorded_at.desc()).all()
        data.append({**subject_to_dict(s), "recordings": [recording_to_dict(r) for r in recs]})
    unassigned = db.query(Recording).filter(Recording.subject_id == None)\
                   .order_by(Recording.recorded_at.desc()).all()
    return templates.TemplateResponse("summaries.html", {
        "request": request,
        "subjects_data": data,
        "unassigned": [recording_to_dict(r) for r in unassigned],
    })

@app.get("/settings", response_class=HTMLResponse)
async def page_settings(request: Request, db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    return templates.TemplateResponse("settings.html", {
        "request": request,
        "subjects": [subject_to_dict(s) for s in subjects],
    })

# ─────────────────────────────────────────────────────────────────────────────
#  API – FÄCHER
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/subjects")
async def api_get_subjects(db: Session = Depends(get_db)):
    return [subject_to_dict(s) for s in db.query(Subject).all()]

@app.post("/api/subjects")
async def api_create_subject(
    name: str = Form(...),
    color: str = Form("#6366f1"),
    abbreviation: str = Form(""),
    db: Session = Depends(get_db),
):
    s = Subject(name=name, color=color, abbreviation=abbreviation or None)
    db.add(s)
    db.commit()
    db.refresh(s)
    return subject_to_dict(s)

@app.put("/api/subjects/{subject_id}")
async def api_update_subject(
    subject_id: int,
    name: str = Form(...),
    color: str = Form(...),
    abbreviation: str = Form(""),
    db: Session = Depends(get_db),
):
    s = db.query(Subject).filter(Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Fach nicht gefunden")
    s.name = name
    s.color = color
    s.abbreviation = abbreviation or None
    db.commit()
    return subject_to_dict(s)

@app.delete("/api/subjects/{subject_id}")
async def api_delete_subject(subject_id: int, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == subject_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Fach nicht gefunden")
    db.delete(s)
    db.commit()
    return {"ok": True}

# ─────────────────────────────────────────────────────────────────────────────
#  API – AUFNAHMEN
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/recordings")
async def api_get_recordings(db: Session = Depends(get_db)):
    recs = db.query(Recording).order_by(Recording.recorded_at.desc()).all()
    return [recording_to_dict(r) for r in recs]

@app.get("/api/recordings/by-month")
async def api_recordings_by_month(year: int, month: int, db: Session = Depends(get_db)):
    """Gibt alle Aufnahmen eines Monats zurück – für den Kalender."""
    recs = db.query(Recording).filter(
        Recording.recorded_at >= datetime(year, month, 1),
        Recording.recorded_at < datetime(year + (month // 12), (month % 12) + 1, 1),
    ).all()
    return [recording_to_dict(r) for r in recs]

@app.post("/api/recordings/upload")
async def api_upload_recording(
    file: UploadFile = File(...),
    subject_id: int = Form(None),
    title: str = Form(""),
    recorded_at: str = Form(""),
    db: Session = Depends(get_db),
):
    # Datei sicher speichern
    suffix = Path(file.filename).suffix or ".wav"
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    dest = AUDIO_DIR / unique_name
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # Datum parsen
    try:
        dt = datetime.fromisoformat(recorded_at) if recorded_at else datetime.utcnow()
    except ValueError:
        dt = datetime.utcnow()

    rec = Recording(
        title=title or file.filename,
        filename=unique_name,
        subject_id=subject_id or None,
        recorded_at=dt,
        status="uploaded",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return recording_to_dict(rec)

@app.delete("/api/recordings/{rec_id}")
async def api_delete_recording(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recording).filter(Recording.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Aufnahme nicht gefunden")
    # Audiodatei löschen
    audio_path = AUDIO_DIR / rec.filename
    if audio_path.exists():
        audio_path.unlink()
    db.delete(rec)
    db.commit()
    return {"ok": True}

@app.get("/api/recordings/{rec_id}/audio")
async def api_serve_audio(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recording).filter(Recording.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Aufnahme nicht gefunden")
    audio_path = AUDIO_DIR / rec.filename
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audiodatei fehlt")
    return FileResponse(audio_path, media_type="audio/mpeg")
