# IDExpSat SaaS - Plataforma de Pesquisas de Satisfação Multi-Tenant

## Visão Geral

IDExpSat é uma plataforma SaaS moderna para gerenciamento de pesquisas de satisfação de clientes em concessionárias automotivas. Desenvolvida com foco em automação, segurança e análise inteligente de dados.

## Características Principais

### 🔐 Autenticação Multi-Tenant
- Isolamento total de dados entre tenants via Row Level Security (RLS)
- Autenticação Supabase integrada
- Extração automática de `tenant_id` do JWT
- Middleware de validação de tenant em todas as operações

### 📤 Ingestão de Dados
- Upload de arquivos CSV com dados de clientes
- Processamento automático de dados
- Extração de tipo de pesquisa do nome do arquivo (VD/PV)
- Geração de hash único para cada compra
- Validação e tratamento de erros robusto

### 🎯 Pesquisas de Satisfação
- Tokens únicos por pesquisa para acesso público
- Página pública de resposta sem autenticação
- Formulários dinâmicos baseados em tipo de pesquisa
- Suporte a múltiplos tipos de perguntas (escala, aberta, múltipla escolha)
- Rastreamento de respostas com timestamp

### 📊 Dashboard e Analytics
- Dashboard tenant com visualização de pesquisas
- KPIs em tempo real (taxa de resposta, NPS, satisfação média)
- Análise de sentimento automática com LLM
- Gráficos e relatórios customizáveis
- Exportação de dados

### 🔔 Notificações
- Notificações automáticas ao tenant quando pesquisa é respondida
- Resumo da avaliação e link direto para dashboard
- Estrutura preparada para integração WhatsApp

## Arquitetura Técnica

### Stack Tecnológico

**Frontend**
- React 19 com TypeScript
- Tailwind CSS 4 para styling
- tRPC para comunicação com backend
- Wouter para roteamento

**Backend**
- Express.js 4
- tRPC 11 para APIs type-safe
- Drizzle ORM para gerenciamento de banco
- Node.js com TypeScript

**Banco de Dados**
- Supabase (PostgreSQL)
- Row Level Security (RLS) para multi-tenant
- Migrations com Drizzle Kit

**Deployment**
- Vercel para frontend e backend
- Supabase para banco de dados
- Variáveis de ambiente seguras

### Estrutura de Diretórios

```
idexpsat-saas/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas (Dashboard, SurveyResponse, etc)
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilitários (tRPC client, etc)
│   └── public/               # Arquivos estáticos
├── server/                    # Backend Express
│   ├── routers/              # tRPC routers (csv, surveys, config)
│   ├── db.ts                 # Query helpers
│   ├── routers.ts            # Router principal
│   └── _core/                # Framework core (auth, context, etc)
├── drizzle/                  # Database schema e migrations
│   ├── schema.ts             # Definição de tabelas
│   └── migrations/           # Arquivos de migração
├── shared/                   # Código compartilhado
├── package.json              # Dependências
├── INTEGRATION_GUIDE.md      # Guia de integração Supabase+Vercel
└── todo.md                   # Tarefas do projeto
```

## Fluxos Principais

### 1. Fluxo de Autenticação Multi-Tenant

```
Novo Usuário Request Acesso
    ↓
Usuário criado no Supabase Auth + Conta "PENDING"
    ↓
SuperAdmin recebe notificação e Aprova ("APPROVED")
    ↓
Usuário Login via Supabase Auth
    ↓
Middleware extrai tenant_id
    ↓
RLS filtra dados por tenant_id
    ↓
Acesso seguro aos dados
```

### 2. Fluxo de Ingestão de CSV

```
Upload CSV
    ↓
Parser extrai tipo_pesquisa (VD/PV)
    ↓
Para cada linha:
  - Cria/atualiza cliente
  - Cria/atualiza veículo
  - Cria compra com hash único
  - Cria pesquisa com token
    ↓
Retorna resultado de processamento
```

### 3. Fluxo de Resposta de Pesquisa

```
Cliente clica link com token
    ↓
Valida token e pesquisa
    ↓
Carrega perguntas por tipo_pesquisa
    ↓
Cliente responde formulário
    ↓
Envia respostas
    ↓
Salva na tabela respostas
    ↓
Marca pesquisa como respondida
    ↓
Análise de sentimento (LLM)
    ↓
Notifica tenant
```

## Tabelas do Banco de Dados

### Estrutura Multi-Tenant

Todas as tabelas possuem `tenant_id` para isolamento de dados:

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Concessionárias/redes |
| `users` | Usuários autenticados |
| `clientes` | Clientes dos tenants |
| `veiculos` | Veículos dos clientes |
| `marcas` | Marcas de veículos |
| `compras` | Registros de compra/venda |
| `tipos_pesquisa` | Tipos de pesquisa (VENDA, PÓS_VENDA) |
| `pesquisas` | Pesquisas de satisfação |
| `perguntas` | Perguntas por tipo de pesquisa |
| `respostas` | Respostas dos clientes |
| `notificacoes` | Histórico de notificações |
| `analytics_cache` | Cache de analytics para performance |

## Endpoints tRPC

### CSV Router
- `csv.uploadAndProcess` - Upload e processamento de CSV

### Surveys Router
- `surveys.getSurveyByToken` - Obter pesquisa por token (público)
- `surveys.submitResponses` - Enviar respostas (público)
- `surveys.listSurveys` - Listar pesquisas (tenant)
- `surveys.getSurveyDetails` - Detalhes da pesquisa (tenant)
- `surveys.getStatistics` - Estatísticas (tenant)

### Config Router
- `config.getSurveyTypes` - Listar tipos de pesquisa
- `config.createSurveyType` - Criar tipo (admin)
- `config.getQuestions` - Listar perguntas
- `config.createQuestion` - Criar pergunta (admin)
- `config.updateQuestion` - Atualizar pergunta (admin)
- `config.deleteQuestion` - Deletar pergunta (admin)

## Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Supabase
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Security
JWT_SECRET=...

# LLM (opcional)
OPENAI_API_KEY=...

# WhatsApp (opcional)
WHATSAPP_API_URL=...
WHATSAPP_API_TOKEN=...
```

## Desenvolvimento

### Instalação

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Aplicar migrations
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Comandos Disponíveis

```bash
pnpm dev          # Iniciar desenvolvimento
pnpm build        # Build para produção
pnpm start        # Iniciar servidor de produção
pnpm check        # Verificar tipos TypeScript
pnpm format       # Formatar código
pnpm test         # Executar testes
pnpm db:push      # Aplicar migrations
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem:
- Usuários só veem dados do seu tenant
- Dados são filtrados automaticamente no banco
- Impossível acessar dados de outro tenant mesmo com SQL injection

### Autenticação

- JWT assinado com `JWT_SECRET`
- Validação de tenant_id em middleware
- Cookies HTTP-only para sessão
- CSRF protection

### Validação

- Validação de entrada com Zod
- Sanitização de dados
- Tratamento de erros seguro
- Logs de auditoria

## Performance

### Otimizações

- Cache de analytics para queries pesadas
- Índices em colunas frequentemente consultadas
- Paginação de resultados
- Lazy loading de componentes

### Monitoramento

- Logs estruturados
- Rastreamento de erros
- Métricas de performance
- Alertas de anomalias

## Roadmap Futuro

- [ ] Integração WhatsApp API oficial
- [ ] Análise de sentimento avançada com LLM
- [ ] Exportação de relatórios em PDF
- [ ] Dashboard em tempo real com WebSockets
- [ ] Integração com CRM externo
- [ ] Mobile app
- [ ] API pública para integrações

## Documentação

- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Guia de integração Supabase + Vercel
- [todo.md](./todo.md) - Tarefas e checklist do projeto

## Suporte

Para dúvidas ou problemas, consulte:
1. Documentação do Supabase: https://supabase.com/docs
2. Documentação do Vercel: https://vercel.com/docs
3. Documentação do tRPC: https://trpc.io/docs

## Licença

MIT

---

**Desenvolvido com ❤️ para concessionárias automotivas**
