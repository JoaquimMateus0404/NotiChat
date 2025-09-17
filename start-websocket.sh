#!/bin/bash

# Script para inicializar o servidor WebSocket do NotiChat

echo "🚀 Iniciando servidor WebSocket do NotiChat..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

# Ir para o diretório do projeto
cd "$(dirname "$0")"

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules_websocket" ]; then
    echo "📦 Instalando dependências..."
    npm install --prefix . --package-lock-only=false express ws uuid nodemon
    mkdir -p node_modules_websocket
    mv node_modules/* node_modules_websocket/ 2>/dev/null || true
    rmdir node_modules 2>/dev/null || true
fi

# Iniciar o servidor
echo "🌐 Iniciando servidor WebSocket na porta 3001..."
NODE_PATH=./node_modules_websocket node websocket-server.js
