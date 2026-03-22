# IDExpSat SaaS - Guia Completo de Configuração e Deployment

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Implementação dos Helpers de Banco de Dados](#implementação-dos-helpers-de-banco-de-dados)
5. [Integração com Análise de Sentimento (LLM)](#integração-com-análise-de-sentimento-llm)
6. [Configuração de Notificações](#configuração-de-notificações)
7. [Teste End-to-End](#teste-end-to-end)
8. [Deployment na Vercel](#deployment-na-vercel)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O IDExpSat SaaS é uma plataforma de pesquisas de satisfação multi-tenant com os seguintes componentes:

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + Backend)          │
│  ┌──────────────────┐         ┌──────────────────────┐  │
│  │  React Frontend  │◄────────┤  Express + tRPC API  │  │
│  │  - Dashboard     │         │  - CSV Upload        │  │
│  │  - Survey Form   │         │  - Surveys CRUD      │  │
│  │  - Analytics     │         │  - Sentiment Analysis│  │
│  └──────────────────┘         └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL + Auth)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Row Level Security (RLS) para multi-tenant    │   │
│  │  - 12 tabelas com tenant_id                      │   │
│  │  - Autenticação Supabase integrada                  │   │
│  │  - Backups automáticos                           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

### Software Instalado

- **Node.js 22+**: https://nodejs.org/
- **pnpm 10+**: `npm install -g pnpm`
- **Git**: https://git-scm.com/
- **VS Code** (recomendado): https://code.visualstudio.com/

### Contas Criadas

- **Supabase**: https://supabase.com (gratuito)
- **Vercel**: https://vercel.com (gratuito)
- **GitHub**: https://github.com (para versionamento)
- **Supabase Auth**: Configurado para gestão de usuários

### Conhecimento Necessário

- Conceitos básicos de SQL
- Familiaridade com Node.js/TypeScript
- Noções de autenticação Supabase
- Entendimento de APIs REST/tRPC

---

## Configuração Inicial

### Passo 1: Clonar o Repositório

```bash
# Clone o repositório (ou use o que você já tem)
git clone https://github.com/seu-usuario/idexpsat-saas.git
cd idexpsat-saas

# Instale as dependências
pnpm install
```

### Passo 2: Criar Projeto Supabase

1. Acesse https://supabase.com
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Name**: `idexpsat-saas`
   - **Database Password**: Gere uma senha forte (salve em local seguro!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
   - **Pricing**: Escolha **Free** para começar

4. Aguarde 2-3 minutos até o projeto estar pronto

### Passo 3: Obter Credenciais Supabase

1. No dashboard do Supabase, vá para **Settings > API**
2. Copie as seguintes credenciais:

```bash
# Salve em um arquivo seguro (não commite!)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]
DATABASE_URL=postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres
```

### Passo 4: Configurar Variáveis de Ambiente

1. Crie arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

2. Preencha com suas credenciais:

```bash
# Database
DATABASE_URL=postgresql://postgres:SEU_PASSWORD@[project-id].pooler.supabase.co:6543/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]

# Email Notification (Nodemailer for Approvals)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=devprojects566@gmail.com
SMTP_PASS=suasenha-app-senha
SMTP_SECURE=false

# WhatsApp Integration (Evolution API)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key-global
EVOLUTION_INSTANCE_NAME=idexpsat

# Supabase Config
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]

# App URLs
VITE_APP_URL=http://localhost:5173

# Node
NODE_ENV=development
```

### Passo 5: Aplicar Migrations

```bash
# Gera migrations e aplica ao banco
pnpm db:push

# Quando perguntado, confirme criando as tabelas
```

### Passo 6: Iniciar Servidor de Desenvolvimento

```bash
# Inicia frontend (localhost:5173) e backend (localhost:3000)
pnpm dev

# Em outro terminal, você pode acompanhar os logs
pnpm dev 2>&1 | tee dev.log
```

Acesse http://localhost:5173 para ver a aplicação rodando.

---

## Implementação dos Helpers de Banco de Dados

Os helpers de banco de dados são funções reutilizáveis que fazem queries no Supabase. Eles são usados pelos routers tRPC.

### Arquivo: `server/db.ts`

Este arquivo já existe, mas precisa ser completado com as funções necessárias para o CSV upload e pesquisas.

#### Passo 1: Adicionar Imports

```typescript
// server/db.ts - No topo do arquivo

import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/PostgreSQL2";
import { 
  users, 
  tenants, 
  clientes, 
  veiculos, 
  marcas, 
  compras, 
  tipos_pesquisa,
  pesquisas,
  perguntas,
  respostas
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
```

#### Passo 2: Adicionar Função para Obter/Criar Cliente

```typescript
/**
 * Obter ou criar cliente
 * Evita duplicatas usando tenant_id + telefone como chave única
 */
export async function getOrCreateCliente(
  tenantId: string,
  nome: string,
  telefone: string,
  cidade: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar cliente existente
    const existing = await db
      .select()
      .from(clientes)
      .where(
        and(
          eq(clientes.tenant_id, tenantId),
          eq(clientes.telefone, telefone)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar novo cliente
    const clienteId = crypto.randomUUID();
    await db.insert(clientes).values({
      id: clienteId,
      tenant_id: tenantId,
      nome,
      telefone,
      cidade,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      id: clienteId,
      tenant_id: tenantId,
      nome,
      telefone,
      cidade,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("[DB] Error in getOrCreateCliente:", error);
    throw error;
  }
}
```

#### Passo 3: Adicionar Função para Obter/Criar Veículo

```typescript
/**
 * Obter ou criar veículo
 * Evita duplicatas usando placa como chave única
 */
export async function getOrCreateVeiculo(
  tenantId: string,
  clienteId: string,
  placa: string,
  modelo: string,
  marcaNome: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Obter ou criar marca
    const marcaId = await getOrCreateMarca(tenantId, marcaNome);

    // Buscar veículo existente
    const existing = await db
      .select()
      .from(veiculos)
      .where(
        and(
          eq(veiculos.tenant_id, tenantId),
          eq(veiculos.placa, placa)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar novo veículo
    const veiculo_id = crypto.randomUUID();
    await db.insert(veiculos).values({
      id: veiculo_id,
      tenant_id: tenantId,
      cliente_id: clienteId,
      marca_id: marcaId,
      placa,
      modelo,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      id: veiculo_id,
      tenant_id: tenantId,
      cliente_id: clienteId,
      marca_id: marcaId,
      placa,
      modelo,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("[DB] Error in getOrCreateVeiculo:", error);
    throw error;
  }
}
```

#### Passo 4: Adicionar Função para Obter/Criar Marca

```typescript
/**
 * Obter ou criar marca
 */
export async function getOrCreateMarca(tenantId: string, nome: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const existing = await db
      .select()
      .from(marcas)
      .where(
        and(
          eq(marcas.tenant_id, tenantId),
          eq(marcas.nome, nome)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0].id;
    }

    const marcaId = crypto.randomUUID();
    await db.insert(marcas).values({
      id: marcaId,
      tenant_id: tenantId,
      nome,
      created_at: new Date(),
    });

    return marcaId;
  } catch (error) {
    console.error("[DB] Error in getOrCreateMarca:", error);
    throw error;
  }
}
```

#### Passo 5: Adicionar Função para Criar Compra com Hash Único

```typescript
/**
 * Criar compra com hash_compra único
 * O hash evita duplicatas mesmo se o mesmo CSV for processado 2x
 */
export async function createCompra(
  tenantId: string,
  clienteId: string,
  veiculo_id: string,
  data_compra: Date,
  valor: number | null = null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Gerar hash único baseado em cliente + veículo + data
    const hashInput = `${clienteId}-${veiculo_id}-${data_compra.toISOString()}`;
    const hash_compra = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex')
      .substring(0, 32);

    // Verificar se compra com este hash já existe
    const existing = await db
      .select()
      .from(compras)
      .where(
        and(
          eq(compras.tenant_id, tenantId),
          eq(compras.hash_compra, hash_compra)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar nova compra
    const compra_id = crypto.randomUUID();
    await db.insert(compras).values({
      id: compra_id,
      tenant_id: tenantId,
      cliente_id: clienteId,
      veiculo_id,
      data_compra,
      valor,
      hash_compra,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      id: compra_id,
      tenant_id: tenantId,
      cliente_id: clienteId,
      veiculo_id,
      data_compra,
      valor,
      hash_compra,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("[DB] Error in createCompra:", error);
    throw error;
  }
}
```

#### Passo 6: Adicionar Função para Criar Pesquisa com Token

```typescript
/**
 * Criar pesquisa com token único
 * Token é usado para acessar a pesquisa publicamente
 */
export async function createPesquisa(
  tenantId: string,
  compraId: string,
  tipoPesquisaId: string,
  expiraEm?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Gerar token único
    const token = nanoid(32);

    // Criar pesquisa
    const pesquisaId = crypto.randomUUID();
    await db.insert(pesquisas).values({
      id: pesquisaId,
      tenant_id: tenantId,
      compra_id: compraId,
      tipo_pesquisa_id: tipoPesquisaId,
      token,
      respondida: false,
      expira_em: expiraEm || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      id: pesquisaId,
      tenant_id: tenantId,
      compra_id: compraId,
      tipo_pesquisa_id: tipoPesquisaId,
      token,
      respondida: false,
      expira_em: expiraEm || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error("[DB] Error in createPesquisa:", error);
    throw error;
  }
}
```

#### Passo 7: Adicionar Função para Obter Pesquisa por Token

```typescript
/**
 * Obter pesquisa por token (público)
 * Valida se token existe e não expirou
 */
export async function getPesquisaByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(pesquisas)
      .where(eq(pesquisas.token, token))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const pesquisa = result[0];

    // Validar se expirou
    if (pesquisa.expira_em && new Date() > pesquisa.expira_em) {
      return null;
    }

    // Validar se já foi respondida
    if (pesquisa.respondida) {
      return null;
    }

    // Buscar perguntas
    const perguntasResult = await db
      .select()
      .from(perguntas)
      .where(eq(perguntas.tipo_pesquisa_id, pesquisa.tipo_pesquisa_id))
      .orderBy(perguntas.ordem);

    return {
      ...pesquisa,
      perguntas: perguntasResult,
    };
  } catch (error) {
    console.error("[DB] Error in getPesquisaByToken:", error);
    throw error;
  }
}
```

#### Passo 8: Adicionar Função para Salvar Respostas

```typescript
/**
 * Salvar respostas da pesquisa
 */
export async function saveRespostas(
  tenantId: string,
  pesquisaId: string,
  respostas: Array<{
    perguntaId: string;
    resposta: string;
    score?: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Salvar cada resposta
    const respostasIds: string[] = [];
    for (const resp of respostas) {
      const respostaId = crypto.randomUUID();
      await db.insert(respostas).values({
        id: respostaId,
        tenant_id: tenantId,
        pesquisa_id: pesquisaId,
        pergunta_id: resp.perguntaId,
        resposta: resp.resposta,
        score: resp.score || null,
        sentimento: null, // Será preenchido pela análise de sentimento
        created_at: new Date(),
      });
      respostasIds.push(respostaId);
    }

    // Marcar pesquisa como respondida
    await db
      .update(pesquisas)
      .set({
        respondida: true,
        updated_at: new Date(),
      })
      .where(eq(pesquisas.id, pesquisaId));

    return respostasIds;
  } catch (error) {
    console.error("[DB] Error in saveRespostas:", error);
    throw error;
  }
}
```

### Passo 3: Testar Helpers

```bash
# Criar arquivo de teste
cat > server/db.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
import {
  getOrCreateCliente,
  getOrCreateMarca,
  createCompra,
  createPesquisa,
} from "./db";

describe("Database Helpers", () => {
  it("should create and retrieve cliente", async () => {
    // TODO: Implementar teste
  });

  it("should create compra with unique hash", async () => {
    // TODO: Implementar teste
  });

  it("should create pesquisa with token", async () => {
    // TODO: Implementar teste
  });
});
EOF

# Executar testes
pnpm test
```

---

## Integração com Análise de Sentimento (LLM)

A análise de sentimento processa automaticamente respostas abertas e extrai insights.

### Passo 1: Criar Router de Sentimento

```typescript
// server/routers/sentiment.ts

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { respostas } from "../../drizzle/schema";

export const sentimentRouter = router({
  /**
   * Analisar sentimento de uma resposta
   */
  analyzeResponse: protectedProcedure
    .input(
      z.object({
        respostaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Buscar resposta
        const resposta = await db
          .select()
          .from(respostas)
          .where(eq(respostas.id, input.respostaId))
          .limit(1);

        if (resposta.length === 0) {
          throw new Error("Response not found");
        }

        const resp = resposta[0];

        // Validar tenant
        if (resp.tenant_id !== ctx.tenantId) {
          throw new Error("Unauthorized");
        }

        // Chamar LLM para análise
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de sentimento. Analise a seguinte resposta de cliente e retorne um JSON com:
- sentimento: 'positivo', 'negativo' ou 'neutro'
- score: número de 0 a 1 indicando força do sentimento
- temas: array de temas principais mencionados
- resumo: resumo da resposta em 1-2 frases`,
            },
            {
              role: "user",
              content: `Analise esta resposta: "${resp.resposta}"`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sentiment_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  sentimento: {
                    type: "string",
                    enum: ["positivo", "negativo", "neutro"],
                  },
                  score: { type: "number", minimum: 0, maximum: 1 },
                  temas: {
                    type: "array",
                    items: { type: "string" },
                  },
                  resumo: { type: "string" },
                },
                required: ["sentimento", "score", "temas", "resumo"],
              },
            },
          },
        });

        // Extrair resultado
        const content = llmResponse.choices[0]?.message.content;
        const analysis = JSON.parse(content);

        // Salvar resultado
        await db
          .update(respostas)
          .set({
            sentimento: analysis.sentimento,
          })
          .where(eq(respostas.id, input.respostaId));

        return analysis;
      } catch (error) {
        console.error("[Sentiment] Error analyzing response:", error);
        throw error;
      }
    }),

  /**
   * Analisar todas as respostas de uma pesquisa
   */
  analyzeSurvey: protectedProcedure
    .input(
      z.object({
        pesquisaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Buscar todas as respostas abertas da pesquisa
        const respostasAbertas = await db
          .select()
          .from(respostas)
          .where(eq(respostas.pesquisa_id, input.pesquisaId));

        // Analisar cada uma
        const analyses = [];
        for (const resp of respostasAbertas) {
          const analysis = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Analise o sentimento desta resposta de cliente.`,
              },
              {
                role: "user",
                content: resp.resposta,
              },
            ],
          });

          analyses.push({
            respostaId: resp.id,
            analysis: analysis.choices[0]?.message.content,
          });
        }

        return analyses;
      } catch (error) {
        console.error("[Sentiment] Error analyzing survey:", error);
        throw error;
      }
    }),
});
```

### Passo 2: Registrar Router de Sentimento

```typescript
// server/routers.ts

import { sentimentRouter } from "./routers/sentiment";

export const appRouter = router({
  // ... outros routers
  sentiment: sentimentRouter,
});
```

### Passo 3: Testar Análise de Sentimento

```bash
# Criar teste
cat > server/routers/sentiment.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
import { sentimentRouter } from "./sentiment";

describe("Sentiment Analysis", () => {
  it("should analyze positive sentiment", async () => {
    // TODO: Implementar teste
  });

  it("should analyze negative sentiment", async () => {
    // TODO: Implementar teste
  });

  it("should extract themes", async () => {
    // TODO: Implementar teste
  });
});
EOF

pnpm test
```

---

## Configuração de Notificações

Notificações automáticas são enviadas ao tenant quando uma pesquisa é respondida.

### Passo 1: Criar Router de Notificações

```typescript
// server/routers/notifications.ts

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { pesquisas, compras, clientes, respostas } from "../../drizzle/schema";

export const notificationsRouter = router({
  /**
   * Enviar notificação ao tenant quando pesquisa é respondida
   */
  notifyOnSurveyResponse: protectedProcedure
    .input(
      z.object({
        pesquisaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Buscar pesquisa
        const pesquisaResult = await db
          .select()
          .from(pesquisas)
          .where(eq(pesquisas.id, input.pesquisaId))
          .limit(1);

        if (pesquisaResult.length === 0) {
          throw new Error("Survey not found");
        }

        const pesquisa = pesquisaResult[0];

        // Validar tenant
        if (pesquisa.tenant_id !== ctx.tenantId) {
          throw new Error("Unauthorized");
        }

        // Buscar informações da compra
        const compraResult = await db
          .select()
          .from(compras)
          .where(eq(compras.id, pesquisa.compra_id))
          .limit(1);

        if (compraResult.length === 0) {
          throw new Error("Purchase not found");
        }

        const compra = compraResult[0];

        // Buscar informações do cliente
        const clienteResult = await db
          .select()
          .from(clientes)
          .where(eq(clientes.id, compra.cliente_id))
          .limit(1);

        const cliente = clienteResult[0] || { nome: "Cliente" };

        // Buscar respostas para gerar resumo
        const respostasResult = await db
          .select()
          .from(respostas)
          .where(eq(respostas.pesquisa_id, input.pesquisaId));

        // Calcular score médio
        const scores = respostasResult
          .filter((r) => r.score !== null)
          .map((r) => r.score as number);
        const scoreMedia =
          scores.length > 0
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : "N/A";

        // Contar sentimentos
        const sentimentos = respostasResult.reduce(
          (acc, r) => {
            if (r.sentimento) acc[r.sentimento] = (acc[r.sentimento] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Enviar notificação
        const title = `Nova Pesquisa Respondida - ${cliente.nome}`;
        const content = `
Cliente: ${cliente.nome}
Score Médio: ${scoreMedia}/10
Respostas: ${respostasResult.length}
Sentimento: ${Object.keys(sentimentos).join(", ") || "Não analisado"}

Clique para ver detalhes no dashboard.
        `.trim();

        const notified = await notifyOwner({
          title,
          content,
        });

        return {
          success: notified,
          pesquisaId: input.pesquisaId,
          clienteNome: cliente.nome,
          scoreMedia,
        };
      } catch (error) {
        console.error("[Notifications] Error notifying owner:", error);
        throw error;
      }
    }),

  /**
   * Listar notificações do tenant
   */
  listNotifications: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Implementar busca de notificações do banco
      return {
        notificacoes: [],
        total: 0,
        page: input.page,
      };
    }),
});
```

### Passo 2: Registrar Router de Notificações

```typescript
// server/routers.ts

import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  // ... outros routers
  notifications: notificationsRouter,
});
```

### Passo 3: Chamar Notificação ao Responder Pesquisa

```typescript
// server/routers/surveys.ts - Atualizar submitResponses

submitResponses: publicProcedure
  .input(
    z.object({
      token: z.string(),
      respostas: z.array(
        z.object({
          perguntaId: z.string(),
          resposta: z.string(),
          score: z.number().optional(),
        })
      ),
    })
  )
  .mutation(async ({ input }) => {
    // ... código existente ...

    // Após salvar respostas:
    try {
      // Chamar análise de sentimento
      await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Analise o sentimento desta resposta",
          },
          {
            role: "user",
            content: input.respostas.map((r) => r.resposta).join("\n"),
          },
        ],
      });

      // Enviar notificação ao tenant
      await notifyOwner({
        title: `Nova Pesquisa Respondida`,
        content: `Uma pesquisa foi respondida. Acesse o dashboard para ver detalhes.`,
      });
    } catch (error) {
      console.error("Error in post-response processing:", error);
      // Não falha a resposta se notificação falhar
    }

    return { success: true };
  }),
```

---

## Teste End-to-End

### Passo 1: Preparar Dados de Teste

```bash
# Criar arquivo CSV de teste
cat > test-data.csv << 'EOF'
TELEFONE;NOME;CIDADE;MODELO;PLACA
11987654321;João Silva;São Paulo;Onix;ABC1234
11987654322;Maria Santos;São Paulo;HB20;XYZ9876
EOF
```

### Passo 2: Testar Upload de CSV

```bash
# Iniciar servidor
pnpm dev

# Em outro terminal, fazer requisição
curl -X POST http://localhost:3000/api/trpc/csv.uploadAndProcess \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "PV_CHERYAMERICANA.csv",
    "content": "TELEFONE;NOME;CIDADE;MODELO;PLACA\n11987654321;João Silva;São Paulo;Onix;ABC1234"
  }'
```

### Passo 3: Testar Acesso à Pesquisa

1. Copie o token retornado do upload
2. Acesse: `http://localhost:5173/pesquisa/[token]`
3. Responda o formulário
4. Verifique se as respostas foram salvas

### Passo 4: Testar Dashboard

1. Faça login como tenant
2. Acesse: `http://localhost:5173/dashboard`
3. Verifique se as pesquisas aparecem
4. Verifique se os KPIs estão corretos

### Passo 5: Testar Análise de Sentimento

```bash
# Chamar análise de sentimento
curl -X POST http://localhost:3000/api/trpc/sentiment.analyzeResponse \
  -H "Content-Type: application/json" \
  -d '{
    "respostaId": "[id-da-resposta]"
  }'
```

---

## Deployment na Vercel

### Passo 1: Preparar Repositório GitHub

```bash
# Adicionar arquivos ao git
git add .
git commit -m "feat: IDExpSat SaaS boilerplate com multi-tenant, CSV upload e pesquisas"
git push origin main
```

### Passo 2: Conectar Vercel

1. Acesse https://vercel.com
2. Clique em **"New Project"**
3. Selecione seu repositório GitHub
4. Configure as variáveis de ambiente (veja abaixo)

### Passo 3: Adicionar Variáveis de Ambiente na Vercel

No Vercel Dashboard, vá para **Settings > Environment Variables**:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres

# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]

# OAuth
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
VITE_APP_ID=[seu-app-id]

# Security
JWT_SECRET=[sua-chave-jwt]

# Node
NODE_ENV=production
```

### Passo 4: Fazer Deploy

```bash
# Fazer push para main
git push origin main

# Vercel irá automaticamente:
# 1. Instalar dependências
# 2. Executar build
# 3. Fazer deploy
# 4. Gerar URL pública

# Acompanhar no dashboard
# https://vercel.com/dashboard
```

### Passo 5: Configurar Domínio Customizado (Opcional)

1. No Vercel Dashboard, vá para **Settings > Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Aguarde propagação (até 48h)

### Passo 6: Verificar Deploy

```bash
# Testar aplicação em produção
curl https://seu-dominio.vercel.app/api/trpc/auth.me

# Deve retornar informações do usuário autenticado
```

---

## Checklist de Deployment

Antes de publicar, verifique:

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Migrations foram aplicadas ao Supabase
- [ ] RLS está habilitado em todas as tabelas
- [ ] Testes passam localmente (`pnpm test`)
- [ ] TypeScript sem erros (`pnpm check`)
- [ ] Build funciona (`pnpm build`)
- [ ] Servidor inicia sem erros (`pnpm start`)
- [ ] Fluxo de login funciona
- [ ] Upload de CSV funciona
- [ ] Pesquisa pública acessível via token
- [ ] Dashboard carrega corretamente
- [ ] Notificações são enviadas

---

## Troubleshooting

### Erro: "Cannot find module '@/components/DashboardLayout'"

**Solução**: O componente `DashboardLayout` já existe no template. Se não encontrar, verifique se está em `client/src/components/DashboardLayout.tsx`.

### Erro: "Database connection failed"

**Solução**:
1. Verifique se `DATABASE_URL` está correta
2. Verifique se a senha do Supabase está correta
3. Verifique se o IP da sua máquina está na whitelist do Supabase

### Erro: "JWT verification failed"

**Solução**:
1. Verifique se `JWT_SECRET` é a mesma em dev e produção
2. Verifique se o token está sendo enviado corretamente
3. Verifique os logs do servidor

### Erro: "RLS policy violation"

**Solução**:
1. Verifique se o usuário tem um `tenant_id` válido
2. Verifique se as políticas RLS estão habilitadas
3. Verifique se o `tenant_id` na query corresponde ao do usuário

### Pesquisas não aparecem no dashboard

**Solução**:
1. Verifique se o CSV foi processado corretamente
2. Verifique se as pesquisas foram criadas no banco
3. Verifique se o `tenant_id` está correto
4. Verifique os logs do servidor

---

## Próximos Passos

Após completar este guia:

1. **Integrar WhatsApp**: Implemente `server/routers/whatsapp.ts` para enviar links via WhatsApp
2. **Customizar Perguntas**: Crie interface para gerenciar perguntas por tipo de pesquisa
3. **Exportar Relatórios**: Implemente exportação de dados em PDF/Excel
4. **Mobile App**: Crie versão mobile com React Native
5. **Analytics Avançado**: Integre gráficos com Recharts/Chart.js

---

## Suporte

Para dúvidas:

1. Consulte [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
2. Consulte [README_PROJECT.md](./README_PROJECT.md)
3. Verifique os logs: `tail -f dev.log`
4. Abra issue no GitHub

---

**Última atualização**: 2026-03-21
**Versão**: 1.0.0
