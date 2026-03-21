# IDExpSat SaaS - Guia de Deployment Passo a Passo

## 🚀 Visão Geral do Processo

```
┌─────────────────────────────────────────────────────────┐
│ 1. Preparar Repositório GitHub                          │
│    └─ Commit todas as mudanças                          │
│    └─ Push para main branch                             │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Configurar Supabase em Produção                      │
│    └─ Criar projeto Supabase                            │
│    └─ Aplicar migrations                                │
│    └─ Habilitar RLS                                     │
│    └─ Copiar credenciais                                │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Configurar Vercel                                    │
│    └─ Conectar repositório GitHub                       │
│    └─ Adicionar variáveis de ambiente                   │
│    └─ Fazer deploy                                      │
│    └─ Configurar domínio customizado                    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Testar em Produção                                   │
│    └─ Testar login                                      │
│    └─ Testar upload de CSV                              │
│    └─ Testar pesquisa pública                           │
│    └─ Testar dashboard                                  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Monitoramento e Manutenção                           │
│    └─ Configurar alertas                                │
│    └─ Monitorar performance                             │
│    └─ Fazer backups                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Pré-requisitos

Antes de começar o deployment, certifique-se de:

- [ ] Código está no GitHub
- [ ] Todos os testes passam localmente
- [ ] Sem erros de TypeScript
- [ ] Arquivo `.env.local` está configurado
- [ ] Migrations foram aplicadas localmente
- [ ] Aplicação funciona em `localhost:5173`

---

## Passo 1: Preparar Repositório GitHub

### 1.1 Verificar Status do Git

```bash
# Verificar se há mudanças não commitadas
git status

# Deve mostrar "nothing to commit, working tree clean"
```

### 1.2 Criar Arquivo `.env.example`

```bash
# Criar exemplo de variáveis de ambiente (sem valores sensíveis)
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@PROJECT_ID.pooler.supabase.co:6543/postgres

# Supabase
SUPABASE_URL=https://PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# Security
JWT_SECRET=your-jwt-secret

# Node
NODE_ENV=production
EOF

# Adicionar ao git
git add .env.example
```

### 1.3 Criar `.gitignore` (se não existir)

```bash
cat > .gitignore << 'EOF'
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules
pnpm-lock.yaml

# Build
dist
build
.next

# Logs
*.log
logs
.manus-logs

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temp
tmp
temp
EOF

git add .gitignore
```

### 1.4 Fazer Commit Final

```bash
# Adicionar todas as mudanças
git add .

# Commit com mensagem descritiva
git commit -m "chore: prepare for production deployment

- Add environment variables example
- Update gitignore
- Ensure all tests pass
- Ready for Vercel deployment"

# Push para main
git push origin main

# Verificar se push foi bem-sucedido
git log --oneline -5
```

---

## Passo 2: Configurar Supabase em Produção

### 2.1 Criar Projeto Supabase

1. Acesse https://supabase.com
2. Clique em **"New Project"**
3. Preencha os dados:

| Campo | Valor |
|-------|-------|
| Organization | Sua organização |
| Name | `idexpsat-saas-prod` |
| Database Password | Gere uma senha forte (salve em local seguro!) |
| Region | South America - São Paulo |
| Pricing | Pro (recomendado para produção) |

4. Clique em **"Create new project"**
5. Aguarde 3-5 minutos até o projeto estar pronto

### 2.2 Obter Credenciais

1. No dashboard do Supabase, vá para **Settings > API**
2. Copie as seguintes credenciais:

```bash
# Salve em um arquivo seguro (não commite!)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]
DATABASE_URL=postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres
```

### 2.3 Aplicar Migrations

```bash
# Exportar variáveis de ambiente
export DATABASE_URL="postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres"

# Aplicar migrations
pnpm db:push

# Confirme quando perguntado
```

### 2.4 Habilitar Row Level Security (RLS)

1. No Supabase Dashboard, vá para **Authentication > Policies**
2. Para cada tabela (pesquisas, clientes, respostas, etc.):
   - Clique em **Enable RLS**
   - As políticas já estão configuradas no schema

### 2.5 Verificar Dados

```bash
# Conectar ao banco de produção
psql "postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres"

# Listar tabelas
\dt

# Verificar se RLS está habilitado
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

# Sair
\q
```

---

## Passo 3: Configurar Vercel

### 3.1 Conectar Repositório GitHub

1. Acesse https://vercel.com
2. Clique em **"New Project"**
3. Clique em **"Import Git Repository"**
4. Selecione seu repositório GitHub `idexpsat-saas`
5. Clique em **"Import"**

### 3.2 Configurar Variáveis de Ambiente

1. Na tela de configuração, vá para **Environment Variables**
2. Adicione as seguintes variáveis:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres

# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=[seu-app-id]

# Security
JWT_SECRET=[gere-uma-chave-segura-com-32-caracteres]

# Node
NODE_ENV=production
```

### 3.3 Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (3-5 minutos)
3. Você verá uma URL como: `https://idexpsat-saas.vercel.app`

### 3.4 Verificar Deploy

```bash
# Testar se a aplicação está rodando
curl https://seu-projeto.vercel.app

# Deve retornar HTML da aplicação
```

### 3.5 Configurar Domínio Customizado (Opcional)

1. No Vercel Dashboard, vá para **Settings > Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `pesquisas.suaempresa.com`)
4. Clique em **"Add"**
5. Siga as instruções para configurar DNS
6. Aguarde propagação (até 48 horas)

---

## Passo 4: Testar em Produção

### 4.1 Testar Login

1. Acesse sua URL de produção
2. Clique em **"Login"**
3. Faça login com suas credenciais Manus
4. Você deve ser redirecionado para o dashboard

### 4.2 Testar Upload de CSV

1. No dashboard, vá para **"Upload CSV"**
2. Selecione um arquivo CSV de teste
3. Clique em **"Enviar e Processar"**
4. Você deve ver mensagem de sucesso

### 4.3 Testar Pesquisa Pública

1. Copie o token retornado do upload
2. Acesse: `https://seu-dominio.com/pesquisa/[token]`
3. Responda o formulário
4. Clique em **"Enviar Respostas"**
5. Você deve ver mensagem de sucesso

### 4.4 Testar Dashboard

1. Volte para o dashboard
2. Vá para **"Pesquisas"**
3. Você deve ver a pesquisa respondida
4. Verifique se os KPIs estão corretos

### 4.5 Verificar Logs

1. No Vercel Dashboard, vá para **"Deployments"**
2. Clique no deployment mais recente
3. Vá para **"Logs"**
4. Procure por erros

---

## Passo 5: Monitoramento e Manutenção

### 5.1 Configurar Alertas no Vercel

1. No Vercel Dashboard, vá para **"Settings > Alerts"**
2. Clique em **"New Alert"**
3. Configure alertas para:
   - Build failures
   - Runtime errors
   - High response times

### 5.2 Monitorar Performance

```bash
# Verificar tempo de resposta
curl -w "\nTime: %{time_total}s\n" https://seu-dominio.com

# Deve ser menor que 1 segundo
```

### 5.3 Fazer Backups

1. No Supabase Dashboard, vá para **"Settings > Backups"**
2. Configure backups automáticos diários
3. Teste restauração de backup periodicamente

### 5.4 Monitorar Uso de Banco de Dados

1. No Supabase Dashboard, vá para **"Reports"**
2. Verifique:
   - Número de conexões
   - Queries por segundo
   - Tamanho do banco

---

## Checklist de Deployment

Antes de considerar o deployment completo, verifique:

### Código
- [ ] Todos os commits foram feitos
- [ ] Código está no GitHub
- [ ] Sem branches não mergeadas
- [ ] README está atualizado

### Testes
- [ ] `pnpm check` passa sem erros
- [ ] `pnpm test` passa
- [ ] `pnpm build` funciona
- [ ] Sem warnings no build

### Supabase
- [ ] Projeto criado
- [ ] Migrations aplicadas
- [ ] RLS habilitado
- [ ] Credenciais copiadas
- [ ] Backups configurados

### Vercel
- [ ] Repositório conectado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy bem-sucedido
- [ ] URL pública acessível

### Testes em Produção
- [ ] Login funciona
- [ ] Upload de CSV funciona
- [ ] Pesquisa pública acessível
- [ ] Dashboard carrega
- [ ] Sem erros nos logs

### Segurança
- [ ] HTTPS habilitado
- [ ] Variáveis sensíveis não estão no código
- [ ] `.env` está no `.gitignore`
- [ ] RLS está habilitado
- [ ] JWT_SECRET é forte

---

## Troubleshooting

### Erro: "Build failed on Vercel"

**Solução**:
1. Verifique os logs no Vercel
2. Verifique se todas as dependências estão instaladas
3. Verifique se `pnpm build` funciona localmente

```bash
# Testar build localmente
pnpm build

# Se falhar, corrija o erro e faça push novamente
```

### Erro: "Database connection refused"

**Solução**:
1. Verifique se `DATABASE_URL` está correta
2. Verifique se o IP da Vercel está na whitelist do Supabase
3. Verifique se a senha está correta

```bash
# Testar conexão
psql "postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres" -c "SELECT 1"
```

### Erro: "RLS policy violation"

**Solução**:
1. Verifique se RLS está habilitado
2. Verifique se as políticas estão configuradas
3. Verifique se o usuário tem tenant_id válido

### Aplicação lenta em produção

**Solução**:
1. Verifique os logs de performance
2. Adicione índices no banco de dados
3. Implemente cache
4. Upgrade para plano Pro do Supabase

---

## Atualizações Futuras

Após o deployment inicial, você pode:

### 1. Adicionar Domínio Customizado
```bash
# No Vercel Dashboard > Settings > Domains
# Adicione seu domínio e configure DNS
```

### 2. Configurar CI/CD Automático
```bash
# Vercel automaticamente faz deploy quando você faz push
# Não precisa fazer nada extra!
```

### 3. Implementar Staging Environment
```bash
# Crie branch 'staging'
# Configure Vercel para fazer deploy automático
# Teste mudanças antes de fazer merge para main
```

### 4. Configurar Webhooks
```bash
# No Supabase, configure webhooks para eventos
# Exemplo: Enviar notificação quando pesquisa é respondida
```

---

## Próximos Passos

Após o deployment bem-sucedido:

1. **Integrar WhatsApp**: Implemente envio de links via WhatsApp
2. **Customizar Branding**: Adicione logo e cores da sua empresa
3. **Treinar Usuários**: Crie documentação para usuários finais
4. **Monitorar Métricas**: Acompanhe uso e performance
5. **Planejar Escalabilidade**: Prepare para crescimento

---

## Suporte

Para dúvidas ou problemas durante o deployment:

1. Consulte [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Consulte [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. Verifique logs no Vercel e Supabase
4. Abra issue no GitHub

---

**Última atualização**: 2026-03-21
**Versão**: 1.0.0
