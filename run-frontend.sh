#!/bin/bash

cd /Users/kamissokobabaidriss/Desktop/SIMULATEUR\ TARIFICATION\ IMMO/frontend

# Utiliser Node v20
source ~/.nvm/nvm.sh
nvm use 20

# Variables d'environnement
export PORT=3000
export BROWSER=none
export GENERATE_SOURCEMAP=false

echo "🚀 Démarrage du serveur frontend sur le port 3000..."
echo "   Utilisation de Node.js $(node --version)"
echo ""

# Démarrer le serveur React
exec npm start