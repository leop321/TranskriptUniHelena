# TranskriptUniHelena 🎓

> Lokales, datenschutzkonformes System zur automatischen Vorlesungstranskription und Lernzielanalyse.  
> Läuft vollständig offline – keine Cloud, keine Kosten. Entwickelt für Linux & Windows.

---

## 🐧 Schnellstart auf Linux (z. B. Surface mit Linux)

### 1. Systempakete installieren
Stelle sicher, dass Python, Venv, Git und FFmpeg (für die Audioverarbeitung) vorhanden sind:

```bash
# Auf Ubuntu / Debian / Pop!_OS / Linux Mint:
sudo apt update && sudo apt install -y python3 python3-venv python3-pip git ffmpeg

# Auf Fedora:
sudo dnf install -y python3 git ffmpeg

# Auf Arch Linux / Manjaro:
sudo pacman -S python git ffmpeg
```

### 2. Klonen & Starten mit einem Befehl
```bash
git clone https://github.com/leop321/TranskriptUniHelena.git
cd TranskriptUniHelena
chmod +x start.sh
./start.sh
```

Das Skript `start.sh` kümmert sich automatisch um:
1. Erstellung der virtuellen Umgebung (`.venv`)
2. Installation aller Abhängigkeiten aus `requirements.txt`
3. Start des Servers unter **http://localhost:8000**

---

## 🪟 Start auf Windows (Alternative)
Einfach die Datei `start.bat` per Doppelklick starten oder im Terminal:
```cmd
git clone https://github.com/leop321/TranskriptUniHelena.git
cd TranskriptUniHelena
start.bat
```

---

## 📱 Zugriff vom Smartphone (im selben WLAN/Hotspot)

Sobald der Server auf deinem Surface läuft, kannst du ihn auch vom Handy aus bedienen:
1. Ermittle die lokale IP-Adresse deines Surface (unter Linux im Terminal: `ip a` oder `hostname -I`).
2. Öffne im Handy-Browser: **`http://<IP-DEINES-SURFACE>:8000`** (z. B. `http://192.168.178.50:8000`).
3. Optional: Im mobilen Browser auf *"Zum Startbildschirm hinzufügen"* tippen – dann verhält es sich wie eine native App!

---

## Projektstruktur

```
TranskriptUniHelena/
├── start.sh               # 🐧 Linux 1-Klick-Starter
├── start.bat              # 🪟 Windows Starter
├── run.py                 # Server-Einstiegspunkt
├── requirements.txt       # Python-Pakete
│
├── app/                   # Gesamter Quellcode
│   ├── main.py            # FastAPI Server & REST-API
│   ├── database.py        # SQLite-Datenbank & Modelle
│   ├── ai/                # KI-Module (Whisper, LLM, RAG, PDF-Export)
│   ├── static/            # CSS, JavaScript (Kalender, Recorder)
│   └── templates/         # HTML-Seiten (Kalender, Zusammenfassungen, Einstellungen)
│
├── config/
│   └── prompts/           # Anpassbare KI-Prompts (einfach editieren!)
│       └── curriculum_mapping.md
│
├── data/                  # Lokale Daten (gesichert durch .gitignore)
│   ├── audio/             # Vorlesungsaufnahmen
│   ├── transcripts/       # Rohtexte
│   ├── summaries/         # Fertige Zusammenfassungen
│   ├── library/           # Lehrbücher als PDF (für Querverweise)
│   ├── vector_db/         # Suchindex der Bücher
│   └── app.db             # Lokale SQLite-Datenbank
│
└── models/                # KI-Modelle (separater lokaler Download)
    ├── whisper/           # Spracherkennung
    └── llm/               # Sprachmodell (GGUF-Format)
```

---

## Prompts anpassen

Die Prompts liegen in `config/prompts/` als einfache Textdateien.  
Öffne z. B. `curriculum_mapping.md` in einem beliebigen Editor und passe die Fragen, Kriterien oder Lernziele für deine Universität an.

---

## Lehrbücher einbinden

Lege PDF-Dateien (z. B. Anatomie-, Physiologie-Lehrbücher) einfach in den Ordner `data/library/`.  
Das System verknüpft relevante Buchkapitel und Seitenzahlen automatisch mit deinen Vorlesungstranskripten.

---

## 🔒 Datenschutz
Alle Daten (Aufnahmen, Transkripte, Datenbank, Lehrbücher) verbleiben ausschließlich auf deinem Surface. Es wird keine Verbindung zu externen KI-Servern aufgebaut.
