@echo off
REM Starts a tiny local web server for the Nexa site (needs Python from python.org)
cd /d "%~dp0"
start "" http://localhost:8000/index.html
python -m http.server 8000 || py -m http.server 8000
pause
