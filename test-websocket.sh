#!/bin/bash

# Script para testar o servidor WebSocket

echo "🧪 Testando conexão com o servidor WebSocket..."

# Verificar se o servidor está rodando
if curl -s http://localhost:3001/status > /dev/null; then
    echo "✅ Servidor WebSocket está rodando"
    echo "📊 Status do servidor:"
    curl -s http://localhost:3001/status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/status
    echo ""
    echo "👥 Usuários conectados:"
    curl -s http://localhost:3001/users | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/users
else
    echo "❌ Servidor WebSocket não está rodando na porta 3001"
    echo "💡 Para iniciar o servidor, execute:"
    echo "   cd /home/duarte-gauss/Projects/NotiChat"
    echo "   node websocket-server.js"
    echo ""
    echo "   Ou use o script de inicialização:"
    echo "   bash start-websocket.sh"
fi
