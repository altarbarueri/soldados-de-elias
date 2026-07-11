#!/bin/bash
# Setup automático - Soldados de Elias
set -e

echo "=== Instalando frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Instalando backend ==="
cd backend
npm install
cd ..

echo ""
echo "================================================"
echo "  PRONTO! Agora vá em:"
echo "  Tools -> Secrets -> adicione:"
echo "    GROQ_API_KEY = sua_chave_groq"
echo "================================================"
echo ""
echo "  Depois rode: cd backend && npm start"
echo ""
