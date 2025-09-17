# WebSocket Server - NotiChat

## Visão Geral

Este é o servidor WebSocket customizado para o NotiChat, adaptado para funcionar perfeitamente com o frontend Next.js existente.

## Características

- ✅ **Compatível com o frontend NotiChat**: Não requer alterações no código do componente de chat
- ✅ **Reconexão automática**: Reconecta automaticamente em caso de queda
- ✅ **Indicadores de digitação**: Mostra quando usuários estão digitando
- ✅ **Status online**: Exibe usuários online em tempo real
- ✅ **Mensagens em tempo real**: Recebe mensagens instantaneamente
- ✅ **Reações**: Permite reagir a mensagens via eventos personalizados
- ✅ **Logs detalhados**: Sistema de logs para debug
- ✅ **API REST**: Endpoints para status e informações de usuários

## Instalação e Execução

### Método 1: Script Automático (Recomendado)

```bash
# Tornar o script executável
chmod +x start-websocket.sh

# Executar o servidor
./start-websocket.sh
```

### Método 2: Manual

```bash
# Instalar dependências (apenas uma vez)
npm install express ws uuid

# Executar o servidor
node websocket-server.js
```

## Teste de Conectividade

Para testar se o servidor está funcionando:

```bash
# Tornar o script executável
chmod +x test-websocket.sh

# Testar conexão
./test-websocket.sh
```

## Endpoints

### WebSocket
- **URL**: `ws://localhost:3001/ws`
- **Descrição**: Endpoint principal do WebSocket

### API REST
- **GET** `/status`: Status do servidor e número de usuários conectados
- **GET** `/users`: Lista de usuários conectados
- **GET** `/`: Página inicial (se necessário)

## Tipos de Mensagem

### Enviadas pelo Frontend ➡️ Servidor

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `user_join` | Identificação inicial do usuário | Conectar usuário |
| `chat_message` | Envio de mensagem | Enviar mensagem de chat |
| `typing_start` | Início de digitação | Usuário começou a digitar |
| `typing_stop` | Parada de digitação | Usuário parou de digitar |
| `custom_event` | Eventos personalizados | Reações, etc. |

### Recebidas pelo Frontend ⬅️ Servidor

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `connection_established` | Confirmação de conexão | Cliente conectado |
| `user_joined` | Novo usuário entrou | Notificação de entrada |
| `users_online` | Lista de usuários online | Lista inicial |
| `update_users` | Atualização da lista | Lista atualizada |
| `new_message` | Nova mensagem recebida | Mensagem de chat |
| `user_typing` | Usuário digitando | Indicador de digitação |
| `user_left` | Usuário desconectou | Notificação de saída |
| `custom_response` | Resposta a eventos | Confirmação de reação |
| `error` | Mensagem de erro | Erro do servidor |

## Estrutura de Dados

### Mensagem de Chat
```json
{
  "type": "chat_message",
  "username": "João",
  "message": "Olá pessoal!",
  "conversationId": "conv-123",
  "data": {
    "userId": "user-456",
    "attachments": []
  }
}
```

### Indicador de Digitação
```json
{
  "type": "typing_start",
  "username": "João",
  "conversationId": "conv-123",
  "data": {
    "userId": "user-456"
  }
}
```

### Reação
```json
{
  "type": "custom_event",
  "username": "João",
  "conversationId": "conv-123",
  "data": {
    "event": "reaction",
    "messageId": "msg-789",
    "emoji": "👍",
    "userId": "user-456"
  }
}
```

## Logs e Debug

O servidor gera logs detalhados no console:

```
🚀 Servidor WebSocket NotiChat rodando em http://localhost:3001
📱 Endpoint WebSocket: ws://localhost:3001/ws
📊 Status: http://localhost:3001/status
👥 Usuários: http://localhost:3001/users

Cliente conectado: a1b2c3d4-e5f6-7890-abcd-ef1234567890
João (user-123) conectado como a1b2c3d4-e5f6-7890-abcd-ef1234567890
Mensagem de João: Olá pessoal! na conversa conv-456
João está digitando na conversa conv-456
João reagiu com 👍 à mensagem msg-789
```

## Solução de Problemas

### Erro: "WebSocket connection failed: Error during WebSocket handshake: Unexpected response code: 400"

**Solução**: O frontend estava tentando conectar em `ws://localhost:3001/` mas o servidor espera `ws://localhost:3001/ws`. Este problema já foi corrigido no hook.

### Erro: "ECONNREFUSED"

**Solução**: O servidor WebSocket não está rodando. Execute `./start-websocket.sh` ou `node websocket-server.js`.

### Erro: "Port 3001 already in use"

**Solução**: Outro processo está usando a porta 3001. Encontre e termine o processo:
```bash
lsof -ti:3001 | xargs kill -9
```

### Usuários não aparecem como online

**Solução**: Certifique-se de que:
1. O servidor WebSocket está rodando
2. O frontend está conectado (verifique o console)
3. O usuário está logado no NextAuth

## Monitoramento

Para monitorar o servidor em tempo real:

```bash
# Ver status em tempo real
watch -n 2 'curl -s http://localhost:3001/status | python3 -m json.tool'

# Ver usuários conectados
watch -n 2 'curl -s http://localhost:3001/users | python3 -m json.tool'
```

## Produção

Para usar em produção:

1. Configure uma variável de ambiente para a porta:
   ```bash
   export PORT=3001
   ```

2. Use um processo manager como PM2:
   ```bash
   npm install -g pm2
   pm2 start websocket-server.js --name "notichat-websocket"
   ```

3. Configure um proxy reverso (Nginx) se necessário:
   ```nginx
   location /ws {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
   }
   ```

## Desenvolvimento

Para desenvolvimento com auto-reload:

```bash
# Instalar nodemon
npm install -g nodemon

# Executar com auto-reload
nodemon websocket-server.js
```
