# NotiChat 

Uma rede social profissional moderna construída com Next.js 14, React e Tailwind CSS. O projeto oferece uma experiência completa de networking profissional com funcionalidades de feed de notícias, chat em tempo real e gerenciamento de perfil.

## 🚀 Funcionalidades Implementadas

### 🏠 Feed de Notícias Interativo
- **Feed personalizado** com posts de profissionais da sua rede
- **Sistema completo de interações** (curtir, comentar, compartilhar, salvar)
- **Criação de posts** com interface intuitiva e suporte a texto
- **Comentários em tempo real** com sistema de threads
- **Notificações automáticas** para todas as interações
- **Tópicos em alta** para descobrir conteúdos relevantes
- **Sugestões de conexões** baseadas em interesses profissionais

### 💬 Sistema de Chat Avançado
- **Mensagens em tempo real** entre profissionais
- **Interface moderna** com lista de contatos e histórico de conversas
- **Busca inteligente** de contatos para encontrar rapidamente conversas
- **Status online** dos usuários em tempo real
- **Indicador de digitação** para melhor experiência
- **Scroll automático** para novas mensagens
- **Interface responsiva** com textarea expansível
- **Emojis e anexos** (interface preparada)

### 👤 Perfil Profissional Completo
- **Perfil detalhado** com informações profissionais completas
- **Edição de perfil** com modal interativo
- **Estatísticas** de conexões, seguidores e visualizações
- **Badge de verificação** para perfis autenticados
- **Experiências e habilidades** organizadas em abas
- **Histórico de atividades** e contribuições
- **Avatar personalizado** com fallback inteligente

### 🔍 Página de Exploração e Descoberta
- **Busca universal** por pessoas, empresas, vagas e cursos
- **Filtros avançados** por localização, área e experiência
- **Conexões inteligentes** com sistema de recomendação
- **Exploração de empresas** com informações detalhadas
- **Vagas de emprego** com candidatura integrada
- **Cursos profissionais** com avaliações e certificados
- **Interface em abas** para navegação organizada

### 🔔 Sistema de Notificações Inteligente
- **Notificações em tempo real** para todas as atividades
- **Centro de notificações** com histórico completo
- **Marcação de lidas/não lidas** com contadores visuais
- **Tipos variados** (curtidas, comentários, conexões, mensagens)
- **Timestamps inteligentes** em português brasileiro
- **Interface não intrusiva** com popover elegante

### 🎨 Interface e Experiência do Usuário
- **Design system completo** com componentes reutilizáveis
- **Modo escuro/claro** com alternância automática
- **Responsividade total** funcionando em todos os dispositivos
- **Animações suaves** e transições elegantes
- **Acessibilidade** como prioridade no desenvolvimento
- **Estados de loading** e feedback visual
- **Skeleton loaders** para melhor UX

### 🔧 Gerenciamento de Estado Avançado
- **Context API** centralizado para todo o estado da aplicação
- **Hooks customizados** para funcionalidades específicas
- **Estado persistente** entre navegações
- **Atualizações otimistas** para melhor performance
- **Gerenciamento de usuário** atual com dados completos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework de CSS utilitário
- **Radix UI** - Componentes de interface acessíveis

### Ferramentas de Desenvolvimento
- **ESLint** - Linter para qualidade de código
- **PostCSS** - Processador de CSS
- **Geist Font** - Fonte moderna e legível
- **Lucide React** - Ícones SVG modernos
- **Class Variance Authority** - Utilitário para variantes de componentes

### Análise e Monitoramento
- **Vercel Analytics** - Análise de performance e uso
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schema TypeScript

## 📦 Estrutura do Projeto

```
NotiChat/
├── app/                    # App Router do Next.js
│   ├── chat/              # Página de chat
│   ├── profile/           # Página de perfil
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial (feed)
├── components/            # Componentes React
│   ├── ui/               # Componentes de interface base
│   ├── chat-interface.tsx # Interface de chat
│   ├── news-feed.tsx     # Feed de notícias
│   ├── navigation.tsx    # Navegação principal
│   └── profile-page.tsx  # Página de perfil
├── lib/                  # Utilitários e dados
│   ├── sample-data.ts    # Dados de exemplo
│   └── utils.ts          # Funções utilitárias
├── hooks/                # React Hooks customizados
├── public/               # Arquivos estáticos
└── styles/               # Estilos globais
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18.0.0 ou superior
- PNPM (recomendado) ou npm/yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/notichat.git
cd notichat
```

2. **Instale as dependências**
```bash
pnpm install
# ou
npm install
```

3. **Execute o servidor de desenvolvimento**
```bash
pnpm dev
# ou
npm run dev
```

4. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador

### Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Gera a build de produção
- `pnpm start` - Inicia o servidor de produção
- `pnpm lint` - Executa o linter do código

## 🎯 Próximos Passos

### Funcionalidades Planejadas
- [ ] **Autenticação de usuário** com OAuth e JWT
- [ ] **Backend API** com banco de dados persistente
- [ ] **Notificações push** em tempo real
- [ ] **Sistema de grupos** e comunidades profissionais
- [ ] **Busca avançada** com filtros por localização, empresa, skills
- [ ] **Integração com calendário** para agendamento de reuniões
- [ ] **Sistema de recomendações** baseado em IA
- [ ] **Upload de arquivos** e documentos profissionais
- [ ] **Videochamadas** integradas ao chat
- [ ] **Analytics do perfil** com métricas de engajamento

### Melhorias Técnicas
- [ ] **Testes unitários** com Jest e Testing Library
- [ ] **Testes E2E** com Playwright
- [ ] **PWA** (Progressive Web App) support
- [ ] **Otimização de performance** com lazy loading
- [ ] **Cache inteligente** com React Query
- [ ] **Internacionalização** (i18n) multi-idioma
- [ ] **WebSockets** para chat em tempo real
- [ ] **Upload de arquivos** com drag & drop
- [ ] **Compressão de imagens** automática

## 🆕 Melhorias Implementadas Recentemente

### ✅ Funcionalidades Concluídas
- ✅ **Sistema de estado global** com Context API e hooks customizados
- ✅ **Notificações em tempo real** com centro de notificações
- ✅ **Toggle de tema** (claro/escuro/sistema) integrado à navegação
- ✅ **Página de exploração** completa com busca e filtros
- ✅ **Chat interativo** com mensagens persistentes e indicadores
- ✅ **Perfil editável** com modal de edição e validação
- ✅ **Posts funcionais** com criação, curtidas e comentários
- ✅ **Interface em português** com UX melhorada
- ✅ **Responsividade total** em todos os componentes
- ✅ **Feedback visual** para todas as ações do usuário

### 🔧 Arquitetura Melhorada
- ✅ **Context API** para gerenciamento de estado global
- ✅ **Hooks customizados** (`usePosts`, `useNotifications`, `useConnections`)
- ✅ **Componentes reutilizáveis** com props tipadas
- ✅ **Estados otimistas** para melhor UX
- ✅ **Memoização** para performance otimizada
- ✅ **TypeScript strict** com tipagem completa

### 🎨 Design System Aprimorado
- ✅ **Cores consistentes** seguindo o design system
- ✅ **Espaçamentos padronizados** em todos os componentes
- ✅ **Animações suaves** com CSS transitions
- ✅ **Estados de hover/focus** bem definidos
- ✅ **Acessibilidade** com ARIA labels e navegação por teclado
- ✅ **Ícones consistentes** com Lucide React

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Diretrizes de Contribuição
- Siga as convenções de código existentes
- Adicione testes para novas funcionalidades
- Mantenha a documentação atualizada
- Use commits semânticos (conventional commits)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvedor Principal* - [GitHub](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- [Radix UI](https://www.radix-ui.com/) pelos componentes acessíveis
- [Tailwind CSS](https://tailwindcss.com/) pelo framework de CSS
- [Lucide](https://lucide.dev/) pelos ícones modernos
- [Vercel](https://vercel.com/) pela plataforma de deploy
- Comunidade open source que torna projetos como este possíveis

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela no repositório!**
