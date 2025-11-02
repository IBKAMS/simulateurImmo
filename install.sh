#!/bin/bash

# Script d'installation pour le Simulateur de Tarification Immobilière
# ALIZ STRATEGY

echo "🏗️  INSTALLATION DU SIMULATEUR DE TARIFICATION IMMOBILIÈRE"
echo "=========================================================="
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null
then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js d'abord."
    echo "   Visitez: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js détecté: $(node -v)"
echo ""

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null
then
    echo "⚠️  MongoDB n'est pas détecté dans le PATH."
    echo "   Assurez-vous que MongoDB est installé et en cours d'exécution."
    echo "   Sur macOS: brew install mongodb-community"
    echo ""
fi

# Installation des dépendances du projet principal
echo "📦 Installation des dépendances du projet principal..."
npm install

# Installation des dépendances du backend
echo ""
echo "📦 Installation des dépendances du backend..."
cd backend
npm install

# Installation des dépendances du frontend
echo ""
echo "📦 Installation des dépendances du frontend..."
cd ../frontend
npm install

# Retour au dossier principal
cd ..

echo ""
echo "=========================================================="
echo "✅ INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo ""
echo "1. Assurez-vous que MongoDB est démarré:"
echo "   brew services start mongodb-community"
echo ""
echo "2. Démarrez l'application:"
echo "   npm run dev"
echo ""
echo "3. Ouvrez votre navigateur à:"
echo "   http://localhost:3000"
echo ""
echo "Bon développement ! 🚀"
echo "=========================================================="