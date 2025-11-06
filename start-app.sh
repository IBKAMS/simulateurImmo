#!/bin/bash

# Script de démarrage pour l'application Simulateur Immo

echo "========================================="
echo "   DÉMARRAGE SIMULATEUR IMMOBILIER"
echo "========================================="
echo ""

# Utiliser Node.js v20
source ~/.nvm/nvm.sh
nvm use 20

# Variables d'environnement
export PORT=3000
export BROWSER=none

# Vérifier le backend
echo "✅ Vérification du backend..."
if curl -s http://localhost:5001 > /dev/null; then
    echo "   Backend déjà actif sur le port 5001"
else
    echo "   ⚠️  Backend non accessible sur le port 5001"
    echo "   Démarrage du backend..."
    cd /Users/kamissokobabaidriss/Desktop/SIMULATEUR\ TARIFICATION\ IMMO/backend
    npm start &
    BACKEND_PID=$!
    echo "   Backend démarré (PID: $BACKEND_PID)"
    sleep 5
fi

# Démarrer le frontend
echo ""
echo "🚀 Démarrage du frontend..."
cd /Users/kamissokobabaidriss/Desktop/SIMULATEUR\ TARIFICATION\ IMMO/frontend

# Démarrer React avec un timeout pour éviter les blocages
timeout 300 npm start 2>&1 | while read line; do
    echo "   [Frontend] $line"
    # Si on détecte que le serveur est compilé, on affiche l'URL
    if [[ "$line" == *"Compiled"* ]] || [[ "$line" == *"compiled"* ]]; then
        echo ""
        echo "========================================="
        echo "✅ APPLICATION DÉMARRÉE AVEC SUCCÈS!"
        echo "========================================="
        echo ""
        echo "📧 Identifiants de connexion:"
        echo "   Email: aidriss01@gmail.com"
        echo "   Mot de passe: ImmoAliz2024"
        echo ""
        echo "🌐 Accédez à l'application:"
        echo "   http://localhost:3000"
        echo ""
        echo "========================================="
    fi
done

echo "Frontend terminé"