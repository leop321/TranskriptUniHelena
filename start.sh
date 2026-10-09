#!/usr/bin/env bash
# ==============================================================================
# TranskriptUniHelena – Linux Startskript
# Startet die Anwendung mit einem einzigen Befehl auf deinem Linux-Surface.
# ==============================================================================

set -e

# Wechsle ins Projektverzeichnis (egal von wo das Skript aufgerufen wird)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎓 Starte TranskriptUniHelena..."

# Prüfe, ob Python 3 installiert ist
if ! command -v python3 &>/dev/null; then
    echo "❌ Fehler: python3 wurde nicht gefunden."
    echo "   Bitte installiere Python: sudo apt install python3 python3-venv python3-pip (auf Ubuntu/Debian)"
    exit 1
fi

# Prüfe, ob ffmpeg installiert ist (wird für Audioverarbeitung benötigt)
if ! command -v ffmpeg &>/dev/null; then
    echo "⚠️  Hinweis: ffmpeg ist nicht installiert. Das wird später für die Audio-Transkription gebraucht."
    echo "   Installation empfohlen: sudo apt install ffmpeg"
fi

# Erstelle virtuelle Umgebung, falls noch nicht vorhanden
if [ ! -d ".venv" ]; then
    echo "📦 Erstelle virtuelle Umgebung (.venv)..."
    python3 -m venv .venv || {
        echo "❌ Fehler beim Erstellen der venv. Eventuell fehlt python3-venv:"
        echo "   sudo apt install python3-venv"
        exit 1
    }
fi

# Aktiviere venv
source .venv/bin/activate

# Installiere Abhängigkeiten, falls nötig
echo "🔄 Prüfe Abhängigkeiten..."
pip install -q -r requirements.txt

# Starte den Server
echo "🚀 Server läuft auf http://localhost:8000"
echo "   Beenden mit STRG+C"
python3 run.py
