"""
TranskriptUniHelena – Einstiegspunkt
Startet den FastAPI-Server mit dem lokalen Webinterface.
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",   # Erreichbar von PC und Handy im selben WLAN
        port=8000,
        reload=True,       # Automatisches Neuladen bei Code-Änderungen
        log_level="info",
    )
