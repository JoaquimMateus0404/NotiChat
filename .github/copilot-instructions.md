# Instruções para Agentes de IA - NotiChat

## Arquitetura e Componentes Principais

### Stack Principal
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: WebSocket server separado (Express) + Socket.io cliente
- **Auth**: NextAuth.js com MongoDB adapter
- **State**: Context API centralizado (`lib/app-context.tsx`)

### Estrutura de Diretórios Crítica
```
app/                    # Next.js App Router - páginas e API routes
├── api/               # API routes organizados por funcionalidade
│   ├── auth/          # Autenticação NextAuth.js
│   ├── posts/         # CRUD de posts do feed
│   ├── messages/      # Sistema de mensagens
│   └── users/         # Gerenciamento de usuários
components/            # Componentes React reutilizáveis
├── ui/               # Componentes base (Radix UI + Tailwind)
├── chat-interface.tsx # Chat completo com WebSocket
├── news-feed.tsx     # Feed principal com posts
└── navigation.tsx    # Navegação principal
hooks/                # React hooks customizados
├── use-websocket.ts  # WebSocket client com reconexão
├── use-chat.ts       # Estado do chat e conversas
└── use-posts.ts      # Estado do feed e interações
lib/
├── app-context.tsx   # Context API global
├── mongodb.ts        # Conexão MongoDB com cache
└── models/           # Schemas Mongoose
```

## Fluxos de Desenvolvimento Críticos

### WebSocket Server (Dual Process)
**IMPORTANTE**: O projeto roda 2 servidores separados:
1. **Next.js server**: `npm run dev` (port 3000)
2. **WebSocket server**: `./start-websocket.sh` (port 3001)

```bash
# Terminal 1 - Next.js
npm run dev

# Terminal 2 - WebSocket
./start-websocket.sh
# ou manualmente: node websocket-server.js
```

### Scripts de Desenvolvimento
```bash
npm run seed          # Popular banco com dados de exemplo
npm run db:reset      # Limpar banco de dados
npm run type-check    # Verificação TypeScript
```

### Conexão WebSocket Pattern
```typescript
// Hook padrão para WebSocket
const { sendMessage, onlineUsers, isConnected } = useWebSocket()

// Chat messages via WebSocket
sendMessage({
  type: 'chat_message',
  conversationId: 'conv-id',
  data: { message: 'texto', userId: 'user-id' }
})
```

## Padrões Específicos do Projeto

### Context API Centralizado
- **Estado global** em `lib/app-context.tsx` - todos os dados compartilhados
- **Hooks especializados** (`use-posts.ts`, `use-notifications.ts`) consomem o context
- **Updates otimistas** - UI atualiza antes da confirmação do servidor

```typescript
// Pattern para atualizações otimistas
const { addPost, updatePost } = usePosts()
// UI atualiza imediatamente, API em background
```

### Mongoose Models Convention
- **Models em** `lib/models/` com interfaces TypeScript
- **Conexão cached** via `lib/mongodb.ts` para evitar múltiplas conexões
- **Referencias cruzadas** entre User, Post, Message, Conversation

### Component Structure Pattern
```typescript
// Pattern padrão dos componentes
"use client"                    // Client components explícitos
import { useSession } from 'next-auth/react'  // Auth em todos
import { cn } from '@/lib/utils'  // Tailwind class merging
```

### API Routes Pattern
```typescript
// Estrutura padrão API routes
export async function GET/POST/PUT/DELETE(request: NextRequest) {
  await connectDB()          // Sempre conectar DB primeiro
  const session = await getServerSession()  // Auth check
  // Logic here
  return NextResponse.json()
}
```

## Integrações e Dependências Externas

### NextAuth.js Configuration
- **Provider**: MongoDB session storage
- **Custom pages**: `/auth/signin`, `/auth/signup`
- **Session check** em todos os componentes protegidos

### Real-time Features
- **Chat**: WebSocket direto (not Socket.io server-side)
- **Notifications**: Polling + WebSocket events
- **Online status**: WebSocket heartbeat
- **Typing indicators**: Throttled WebSocket events

### File Upload Flow
- **API route**: `/api/upload` - handles file upload
- **Storage**: Public directory (`/public/uploads/`)
- **Supported**: Images, documents via `multer`-like approach

## Convenções de Código Específicas

### State Management Pattern
```typescript
// Context reducer pattern usado consistentemente
type Action = 
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'TOGGLE_LIKE'; payload: { postId: number; userId: string } }

// Hooks customizados expõem ações tipadas
const { addPost, toggleLike } = usePosts()
```

### TypeScript Strictness
- **Interfaces explícitas** para todas as entidades (User, Post, Message)
- **Types importados** de `@/lib/sample-data` para consistência
- **Client components** sempre tipados com event handlers

### Error Handling Pattern
```typescript
// Pattern padrão para error handling
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) throw new Error('Failed to...')
  // Success logic
} catch (error) {
  console.error('Error:', error)
  // User feedback via toast/notification
}
```

### CSS/Styling Conventions
- **Tailwind classes** com `cn()` utility para merging conditional classes
- **Radix UI** como base - não customizar primitives, usar composition
- **Responsive design** com mobile-first approach
- **Dark/light theme** via `next-themes` provider

## Notes de Debugging

### WebSocket Issues
- **Check both servers running** (3000 + 3001)
- **Network tab**: Verify WS connection upgrade
- **Console logs**: Server logs estado de conexões

### Database Issues
- **MongoDB Atlas**: Check connection string in `.env`
- **Seeding**: Run `pnpm seed` para dados iniciais
- **Reset**: `pnpm db:reset` para limpar completamente

### Authentication Issues
- **NextAuth config**: Verificar providers em `lib/auth.ts`
- **Session persistence**: MongoDB adapter automaticamente handle
- **Client session**: Verificar `useSession()` hook usage

Este projeto prioriza **real-time features** e **user experience**, então sempre considere impacto de performance e estado otimista nas implementações.