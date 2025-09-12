# NotiChat 

Uma rede social profissional moderna construída com Next.js 14, React e Tailwind CSS. O projeto oferece uma experiência completa de networking profissional com funcionalidades de feed de notícias, chat em tempo real e gerenciamento de perfil.

## 🚀 Funcionalidades

### 🏠 Feed de Notícias
- **Feed personalizado** com posts de profissionais da sua rede
- **Sistema de interações** (curtir, comentar, compartilhar, salvar)
- **Criação de posts** com suporte a texto, imagens e arquivos
- **Tópicos em alta** para descobrir conteúdos relevantes
- **Sugestões de conexões** baseadas em interesses profissionais

### 💬 Sistema de Chat
- **Mensagens em tempo real** entre profissionais
- **Interface intuitiva** com lista de contatos e histórico de conversas
- **Busca de contatos** para encontrar rapidamente conversas
- **Status online** dos usuários
- **Suporte a mensagens de texto** com interface responsiva

### 👤 Perfil Profissional
- **Perfil completo** com informações profissionais
- **Experiências e habilidades** detalhadas
- **Conexões e seguidores** organizados
- **Histórico de atividades** e contribuições

### 🎨 Interface Moderna
- **Design responsivo** que funciona em todos os dispositivos
- **Componentes reutilizáveis** construídos com Radix UI
- **Sistema de temas** com suporte a modo escuro/claro
- **Animações suaves** e transições elegantes
- **Acessibilidade** como prioridade no desenvolvimento

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
