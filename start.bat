@echo off
REM ==============================================================================
REM TranskriptUniHelena – Windows Startskript
REM ==============================================================================

cd /d "%~dp0"
echo 🎓 Starte TranskriptUniHelena...

if not exist ".venv" (
    echo 📦 Erstelle virtuelle Umgebung...
    python -m venv .venv
)

call .venv\Scripts\activate.bat
echo 🔄 Installiere/Pruefe Abhaengigkeiten...
pip install -r requirements.txt
echo 🚀 Starte Server...
python run.py
pause
