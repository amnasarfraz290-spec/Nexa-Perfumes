#!/bin/sh
# Starts a tiny local web server for the Nexa site (Mac / Linux, needs Python 3)
cd "$(dirname "$0")"
echo "Nexa is running at http://localhost:8000/index.html  (press Ctrl+C to stop)"
( sleep 1; (open http://localhost:8000/index.html || xdg-open http://localhost:8000/index.html) >/dev/null 2>&1 ) &
python3 -m http.server 8000
