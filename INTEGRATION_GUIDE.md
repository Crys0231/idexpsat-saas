# IDExpSat SaaS - Guia de Integração Supabase + Vercel

## Visão Geral

Este guia fornece instruções passo a passo para configurar a plataforma IDExpSat SaaS com Supabase como banco de dados e Vercel como plataforma de deployment.

## Arquitetura Multi-Tenant

A plataforma utiliza **Row Level Security (RLS)** do Supabase para garantir isolamento total de dados entre tenants. Cada tenant tem um `tenant_id` único que é extraído do JWT durante a autenticação.

### Fluxo de Autenticação Multi-Tenant

```
1. Usuário faz login via Supabase Auth
2. JWT é gerado com claims customizados incluindo tenant_id
3. No backend, tenant_id é extraído do JWT e adicionado ao contexto
4. Todas as queries são automaticamente filtradas por tenant_id via RLS
5. Usuário só pode acessar dados do seu tenant
```

## Configuração do Supabase

### 1. Criar Projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova organização ou use uma existente
3. Crie um novo projeto com as seguintes configurações:
   - **Name**: `idexpsat-saas` (ou seu nome preferido)
   - **Database Password**: Gere uma senha forte
   - **Region**: Escolha a região mais próxima
   - **Pricing Plan**: Recomendado `Pro` para produção

### 2. Configurar Variáveis de Ambiente

Após criar o projeto, copie as credenciais:

```bash
# Acesse Project Settings > API
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
DATABASE_URL=postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres
```

### 3. Aplicar Migrations

O schema foi criado com Drizzle ORM. Para aplicar as migrations:

```bash
# No diretório do projeto
pnpm db:push

# Isso irá:
# 1. Gerar migrations baseado no schema.ts
# 2. Aplicar migrations ao banco de dados Supabase
```

### 4. Configurar Row Level Security (RLS)

RLS garante que cada usuário só possa acessar dados do seu tenant. As políticas já estão configuradas no schema, mas você pode verificar/customizar:

#### Exemplo de Política RLS para Tabela `pesquisas`

```sql
-- Política de SELECT: Usuário só vê pesquisas do seu tenant
CREATE POLICY "Users can select surveys from their tenant"
ON pesquisas FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM users 
    WHERE open_id = auth.jwt() ->> 'sub'
  )
);

-- Política de INSERT: Usuário só cria pesquisas no seu tenant
CREATE POLICY "Users can insert surveys to their tenant"
ON pesquisas FOR INSERT
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM users 
    WHERE open_id = auth.jwt() ->> 'sub'
  )
);
```

### 5. Habilitar RLS em Todas as Tabelas

No Supabase Dashboard:

1. Vá para **Authentication > Policies**
2. Para cada tabela (pesquisas, clientes, respostas, etc.):
   - Clique em **Enable RLS**
   - Adicione políticas para SELECT, INSERT, UPDATE, DELETE

## Configuração do Vercel

### 1. Conectar Repositório GitHub

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Selecione seu repositório GitHub
4. Configure as variáveis de ambiente (veja abaixo)

### 2. Adicionar Variáveis de Ambiente

No Vercel Dashboard, vá para **Settings > Environment Variables** e adicione:

```bash
# Supabase
DATABASE_URL=postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# OAuth (Supabase Auth)
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
VITE_APP_ID=[seu-app-id]

# JWT
JWT_SECRET=[gere-uma-chave-segura]

# Outros
NODE_ENV=production
```

### 3. Deploy

```bash
# Fazer push para main branch
git push origin main

# Vercel irá automaticamente:
# 1. Instalar dependências
# 2. Executar build
# 3. Fazer deploy
```

## Estrutura de Dados

### Tabelas Principais

#### `tenants`
Representa cada concessionária/rede.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users`
Usuários autenticados com tenant_id.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  open_id VARCHAR(64) UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(320) NOT NULL,
  name TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  last_signed_in TIMESTAMP DEFAULT NOW()
);
```

#### `pesquisas`
Pesquisas de satisfação com tokens únicos.

```sql
CREATE TABLE pesquisas (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  compra_id UUID NOT NULL REFERENCES compras(id),
  tipo_pesquisa_id UUID NOT NULL REFERENCES tipos_pesquisa(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  respondida BOOLEAN DEFAULT FALSE,
  expira_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### `respostas`
Respostas dos clientes às pesquisas.

```sql
CREATE TABLE respostas (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  pesquisa_id UUID NOT NULL REFERENCES pesquisas(id),
  pergunta_id UUID NOT NULL REFERENCES perguntas(id),
  resposta TEXT NOT NULL,
  score INT,
  sentimento VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Fluxo de Ingestão de CSV

### 1. Upload de Arquivo

```bash
POST /api/trpc/csv.uploadAndProcess
Content-Type: application/json

{
  "filename": "PV_CHERYAMERICANA.csv",
  "content": "TELEFONE;NOME;CIDADE;MODELO;PLACA\n..."
}
```

### 2. Processamento

1. Extrai tipo_pesquisa do prefixo do arquivo (PV = PÓS_VENDA, VD = VENDA)
2. Extrai marca do nome do arquivo
3. Para cada linha do CSV:
   - Cria/atualiza cliente
   - Cria/atualiza veículo
   - Cria compra com hash_compra único
   - Cria pesquisa com token único

### 3. Geração de Token

Cada pesquisa recebe um token único:

```typescript
const token = randomUUID(); // ou use nanoid() para tokens mais curtos
```

Token é usado na URL pública: `https://seu-dominio.com/pesquisa/[token]`

## Fluxo de Resposta de Pesquisa

### 1. Cliente Clica no Link

```
https://seu-dominio.com/pesquisa/abc123def456
```

### 2. Validação de Token

- Verifica se token existe
- Verifica se pesquisa já foi respondida
- Verifica se não expirou

### 3. Carregamento de Perguntas

Baseado em `tipo_pesquisa_id`, carrega perguntas da tabela `perguntas`.

### 4. Envio de Respostas

```bash
POST /api/trpc/surveys.submitResponses
Content-Type: application/json

{
  "token": "abc123def456",
  "respostas": [
    {
      "perguntaId": "uuid-1",
      "resposta": "Excelente",
      "score": 10
    },
    {
      "perguntaId": "uuid-2",
      "resposta": "O atendimento foi muito bom",
      "score": null
    }
  ]
}
```

### 5. Processamento de Resposta

- Salva respostas na tabela `respostas`
- Marca pesquisa como respondida
- Dispara análise de sentimento com LLM (se habilitado)
- Envia notificação ao tenant

## Integração WhatsApp (Preparação)

A estrutura está preparada para integração futura da API oficial do WhatsApp:

```typescript
// Será implementado em: server/routers/whatsapp.ts
interface SendMessagePayload {
  tenantId: string;
  telefone: string;
  pesquisaToken: string;
  clienteNome: string;
}

// Exemplo de mensagem
const mensagem = `
Olá ${clienteNome}!

Agradecemos sua compra. Sua opinião é muito importante para nós.

Clique no link abaixo para responder uma breve pesquisa de satisfação:
https://seu-dominio.com/pesquisa/${pesquisaToken}

Obrigado!
`;
```

## Análise de Sentimento com LLM

A plataforma integra análise automática de sentimento:

```typescript
// server/routers/sentiment.ts (a ser implementado)
interface SentimentAnalysis {
  sentimento: 'positivo' | 'negativo' | 'neutro';
  score: number; // 0-1
  temas: string[];
  resumo: string;
}
```

## Variáveis de Ambiente Completas

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OAuth
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
VITE_APP_ID=...

# Security
JWT_SECRET=...

# LLM (para análise de sentimento)
OPENAI_API_KEY=... (opcional)

# WhatsApp (para integração futura)
WHATSAPP_API_URL=... (opcional)
WHATSAPP_API_TOKEN=... (opcional)

# Environment
NODE_ENV=production
```

## Troubleshooting

### Erro: "User is not associated with any tenant"

**Causa**: JWT não contém `tenant_id` ou usuário não tem tenant_id no banco.

**Solução**:
1. Verifique se o JWT contém o claim `tenant_id`
2. Verifique se o usuário foi criado com `tenant_id` no banco
3. Verifique se as políticas RLS estão habilitadas

### Erro: "Access denied: tenant_id mismatch"

**Causa**: Usuário tentou acessar dados de outro tenant.

**Solução**: Isso é esperado! O RLS está funcionando corretamente. Verifique se o `tenant_id` na requisição corresponde ao tenant do usuário.

### Erro: "Failed to connect to database"

**Causa**: `DATABASE_URL` inválida ou banco não está acessível.

**Solução**:
1. Verifique se `DATABASE_URL` está correta
2. Verifique se IP da Vercel está na whitelist do Supabase
3. Verifique se a senha do banco está correta

## Próximos Passos

1. **Configurar Domínio Customizado**: Adicione seu domínio no Vercel
2. **Configurar SSL**: Vercel fornece SSL gratuito
3. **Configurar Analytics**: Integre Google Analytics ou similar
4. **Configurar Backups**: Configure backups automáticos no Supabase
5. **Monitoramento**: Configure alertas para erros e performance

## Suporte

Para dúvidas ou problemas:

1. Consulte a documentação do Supabase: https://supabase.com/docs
2. Consulte a documentação do Vercel: https://vercel.com/docs
3. Verifique os logs no Vercel Dashboard
4. Verifique os logs no Supabase Dashboard

---

**Última atualização**: 2026-03-21
