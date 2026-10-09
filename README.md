# TranskriptUniHelena 🎓

> Lokales, datenschutzkonformes System zur automatischen Vorlesungstranskription und Lernzielanalyse.  
> Läuft vollständig offline – keine Cloud, keine Kosten.

---

## Schnellstart (auf dem Surface oder einem neuen PC)

### Voraussetzungen
- Python 3.10 oder neuer (https://www.python.org/downloads/)
- Git

### 1. Repository klonen
```bash
git clone https://github.com/DEIN-USERNAME/TranskriptUniHelena.git
cd TranskriptUniHelena
```

### 2. Virtuelle Umgebung erstellen und aktivieren
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 3. Abhängigkeiten installieren
```bash
pip install -r requirements.txt
```

### 4. Server starten
```bash
python run.py
```

Der Server ist dann unter **http://localhost:8000** erreichbar.  
Vom Handy im selben WLAN: **http://[IP-des-PCs]:8000**

---

## Projektstruktur

```
TranskriptUniHelena/
├── app/                   # Gesamter Quellcode
│   ├── ai/                # KI-Module (Whisper, LLM, RAG, PDF-Export)
│   ├── static/            # CSS, JavaScript, Icons
│   └── templates/         # HTML-Seiten
├── config/
│   └── prompts/           # Anpassbare KI-Prompts (einfach editieren!)
├── data/                  # Lokale Daten (nicht auf GitHub)
│   ├── audio/             # Vorlesungsaufnahmen
│   ├── transcripts/       # Rohtexte
│   ├── summaries/         # Fertige Zusammenfassungen
│   ├── library/           # Lehrbücher als PDF (für Querverweise)
│   └── vector_db/         # Suchindex der Bücher
├── models/                # KI-Modelle (nicht auf GitHub)
│   ├── whisper/           # Spracherkennung
│   └── llm/               # Sprachmodell (GGUF-Format)
├── requirements.txt
└── run.py                 # Einstiegspunkt
```

---

## KI-Modelle installieren (separater Schritt)

> ⚠️ Diese Modelle sind zu groß für GitHub und werden lokal heruntergeladen.

```bash
# Noch nicht in dieser Phase – Anleitung folgt im nächsten Schritt
python download_models.py
```

---

## Prompts anpassen

Die KI-Prompts liegen in `config/prompts/` als einfache Textdateien.  
Öffne z. B. `curriculum_mapping.md` in einem beliebigen Texteditor und passe  
den Stil, die Lernziele oder das Ausgabeformat nach deinen Wünschen an.

---

## Lehrbücher einbinden

Lege PDF-Dateien einfach in den Ordner `data/library/`.  
Beim nächsten Start indexiert das System sie automatisch und verknüpft  
relevante Kapitel mit deinen Vorlesungszusammenfassungen.

---

## Datenschutz

Alle Daten (Aufnahmen, Transkripte, Datenbank) verbleiben ausschließlich  
auf deinem Gerät. Es wird keine Internetverbindung für die Kernfunktionen benötigt.
