#!/bin/bash
cd /Users/kamissokobabaidriss/Desktop/SIMULATEUR\ TARIFICATION\ IMMO/frontend

# Variables d'environnement
export PORT=3000
export BROWSER=none
export GENERATE_SOURCEMAP=false

echo "Starting frontend server on port 3000..."
echo "Using Node version:"
node --version
echo ""

# Démarrer React avec des logs détaillés
npm start 2>&1 | while read line; do
    echo "[$(date +'%H:%M:%S')] $line"
done