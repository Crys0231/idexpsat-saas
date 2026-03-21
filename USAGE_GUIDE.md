# IDExpSat SaaS - Guia de Uso e Modificações

## 📚 Índice

1. [Estrutura do Código](#estrutura-do-código)
2. [Como Modificar Componentes](#como-modificar-componentes)
3. [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)
4. [Como Customizar Perguntas](#como-customizar-perguntas)
5. [Como Integrar WhatsApp](#como-integrar-whatsapp)
6. [Padrões de Código](#padrões-de-código)
7. [Debugging](#debugging)

---

## Estrutura do Código

### Frontend (React + TypeScript)

```
client/src/
├── pages/
│   ├── Home.tsx                 # Landing page
│   ├── Dashboard.tsx            # Dashboard do tenant
│   ├── SurveyResponse.tsx       # Página pública de resposta
│   └── NotFound.tsx             # Página 404
├── components/
│   ├── DashboardLayout.tsx      # Layout do dashboard
│   ├── CSVUpload.tsx            # Upload de CSV
│   ├── SurveysList.tsx          # Lista de pesquisas
│   ├── Analytics.tsx            # Gráficos e KPIs
│   └── ui/                      # Componentes shadcn/ui
├── contexts/
│   └── ThemeContext.tsx         # Contexto de tema
├── hooks/
│   └── useAuth.ts               # Hook de autenticação
├── lib/
│   └── trpc.ts                  # Cliente tRPC
└── App.tsx                      # Roteador principal
```

### Backend (Express + tRPC)

```
server/
├── routers/
│   ├── csv.ts                   # Upload e processamento de CSV
│   ├── surveys.ts               # Gerenciamento de pesquisas
│   ├── config.ts                # Configuração de perguntas
│   ├── sentiment.ts             # Análise de sentimento (LLM)
│   └── notifications.ts         # Notificações
├── db.ts                        # Query helpers
├── routers.ts                   # Router principal
└── _core/
    ├── context.ts               # Contexto tRPC (tenant_id)
    ├── trpc.ts                  # Definição de tRPC
    ├── multitenant.ts           # Middleware multi-tenant
    ├── auth.ts                  # Autenticação OAuth
    ├── llm.ts                   # Integração com LLM
    └── notification.ts          # Notificações ao owner
```

### Banco de Dados

```
drizzle/
├── schema.ts                    # Definição de tabelas
└── migrations/                  # Arquivos de migração
```

---

## Como Modificar Componentes

### Exemplo 1: Customizar Dashboard

**Arquivo**: `client/src/pages/Dashboard.tsx`

```typescript
// Adicionar novo card de estatística
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-slate-600">
      Satisfação Média
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">8.5</div>
    <p className="text-xs text-slate-500 mt-1">Baseado em 150 respostas</p>
  </CardContent>
</Card>
```

### Exemplo 2: Customizar Página de Resposta

**Arquivo**: `client/src/pages/SurveyResponse.tsx`

```typescript
// Adicionar logo da concessionária
<div className="max-w-2xl mx-auto">
  <img 
    src="https://seu-cdn.com/logo.png" 
    alt="Logo" 
    className="h-12 mb-6"
  />
  <Card>
    {/* resto do código */}
  </Card>
</div>
```

### Exemplo 3: Adicionar Campo ao Formulário

**Arquivo**: `client/src/pages/SurveyResponse.tsx`

```typescript
// Adicionar campo de email antes do formulário
<div className="mb-6">
  <label className="block text-sm font-medium text-slate-900 mb-2">
    Seu Email (opcional)
  </label>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="seu@email.com"
    className="w-full px-3 py-2 border border-slate-300 rounded-md"
  />
</div>
```

---

## Como Adicionar Novas Funcionalidades

### Passo 1: Adicionar Tabela ao Schema

**Arquivo**: `drizzle/schema.ts`

```typescript
// Exemplo: Adicionar tabela de feedback
export const feedbacks = mysqlTable("feedbacks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenant_id: varchar("tenant_id", { length: 36 }).notNull(),
  pesquisa_id: varchar("pesquisa_id", { length: 36 }).notNull(),
  feedback: text("feedback"),
  rating: int("rating"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;
```

### Passo 2: Aplicar Migration

```bash
pnpm db:push

# Confirme quando perguntado
```

### Passo 3: Adicionar Query Helper

**Arquivo**: `server/db.ts`

```typescript
export async function createFeedback(
  tenantId: string,
  pesquisaId: string,
  feedback: string,
  rating: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const feedbackId = crypto.randomUUID();
  await db.insert(feedbacks).values({
    id: feedbackId,
    tenant_id: tenantId,
    pesquisa_id: pesquisaId,
    feedback,
    rating,
    created_at: new Date(),
  });

  return feedbackId;
}
```

### Passo 4: Adicionar Endpoint tRPC

**Arquivo**: `server/routers/surveys.ts`

```typescript
// Adicionar ao surveysRouter
createFeedback: protectedProcedure
  .input(
    z.object({
      pesquisaId: z.string(),
      feedback: z.string(),
      rating: z.number().min(1).max(5),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const feedbackId = await createFeedback(
      ctx.tenantId,
      input.pesquisaId,
      input.feedback,
      input.rating
    );

    return { success: true, feedbackId };
  }),
```

### Passo 5: Usar no Frontend

**Arquivo**: `client/src/components/FeedbackForm.tsx`

```typescript
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function FeedbackForm({ pesquisaId }: { pesquisaId: string }) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);

  const createMutation = trpc.surveys.createFeedback.useMutation();

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      pesquisaId,
      feedback,
      rating,
    });
  };

  return (
    <div className="space-y-4">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Deixe seu feedback..."
        className="w-full p-2 border rounded"
      />
      <div>
        <label>Rating: {rating}/5</label>
        <input
          type="range"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
        />
      </div>
      <Button onClick={handleSubmit}>Enviar Feedback</Button>
    </div>
  );
}
```

---

## Como Customizar Perguntas

### Opção 1: Perguntas Fixas (Recomendado para Começar)

**Arquivo**: `server/routers/config.ts`

```typescript
// Perguntas pré-configuradas por tipo de pesquisa
const SURVEY_QUESTIONS = {
  VENDA: [
    {
      id: "q1",
      pergunta: "Como foi sua experiência na compra?",
      tipo: "escala",
      ordem: 1,
    },
    {
      id: "q2",
      pergunta: "O atendimento foi satisfatório?",
      tipo: "escala",
      ordem: 2,
    },
    {
      id: "q3",
      pergunta: "Deixe um comentário (opcional)",
      tipo: "aberta",
      ordem: 3,
    },
  ],
  POS_VENDA: [
    {
      id: "q4",
      pergunta: "Como está sendo sua experiência com o veículo?",
      tipo: "escala",
      ordem: 1,
    },
    {
      id: "q5",
      pergunta: "Recomendaria nossos serviços?",
      tipo: "escala",
      ordem: 2,
    },
  ],
};
```

### Opção 2: Perguntas Dinâmicas (Banco de Dados)

**Arquivo**: `server/routers/config.ts`

```typescript
// Endpoint para criar pergunta
createQuestion: adminProcedure
  .input(
    z.object({
      tipoPesquisaId: z.string(),
      pergunta: z.string(),
      tipo: z.enum(["escala", "multipla_escolha", "aberta"]),
      ordem: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const perguntaId = crypto.randomUUID();
    await db.insert(perguntas).values({
      id: perguntaId,
      tenant_id: ctx.tenantId,
      tipo_pesquisa_id: input.tipoPesquisaId,
      pergunta: input.pergunta,
      tipo: input.tipo,
      ordem: input.ordem,
      ativa: true,
      created_at: new Date(),
    });

    return { success: true, perguntaId };
  }),
```

### Opção 3: Interface de Administração

**Arquivo**: `client/src/pages/AdminQuestions.tsx`

```typescript
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminQuestions() {
  const [pergunta, setPergunta] = useState("");
  const [tipo, setTipo] = useState("escala");

  const createMutation = trpc.config.createQuestion.useMutation();

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      tipoPesquisaId: "venda-uuid",
      pergunta,
      tipo: tipo as any,
      ordem: 1,
    });
  };

  return (
    <div className="space-y-4">
      <Input
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
        placeholder="Digite a pergunta..."
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="escala">Escala (1-10)</option>
        <option value="aberta">Resposta Aberta</option>
        <option value="multipla_escolha">Múltipla Escolha</option>
      </select>
      <Button onClick={handleCreate}>Criar Pergunta</Button>
    </div>
  );
}
```

---

## Como Integrar WhatsApp

### Passo 1: Criar Router WhatsApp

**Arquivo**: `server/routers/whatsapp.ts`

```typescript
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const whatsappRouter = router({
  /**
   * Enviar link de pesquisa via WhatsApp
   * Integração com API oficial do WhatsApp
   */
  sendSurveyLink: protectedProcedure
    .input(
      z.object({
        telefone: z.string(),
        pesquisaToken: z.string(),
        clienteNome: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validar telefone
        const telefoneLimpo = input.telefone.replace(/\D/g, "");
        if (telefoneLimpo.length < 10) {
          throw new Error("Telefone inválido");
        }

        // Construir mensagem
        const linkPesquisa = `https://seu-dominio.com/pesquisa/${input.pesquisaToken}`;
        const mensagem = `
Olá ${input.clienteNome}!

Agradecemos sua compra. Sua opinião é muito importante para nós.

Clique no link abaixo para responder uma breve pesquisa de satisfação:
${linkPesquisa}

Obrigado!
        `.trim();

        // Chamar API WhatsApp
        const response = await fetch(
          "https://graph.instagram.com/v18.0/YOUR_PHONE_NUMBER_ID/messages",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: telefoneLimpo,
              type: "text",
              text: {
                preview_url: true,
                body: mensagem,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`WhatsApp API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          messageId: data.messages[0]?.id,
          telefone: input.telefone,
        };
      } catch (error) {
        console.error("[WhatsApp] Error sending message:", error);
        throw error;
      }
    }),

  /**
   * Enviar pesquisa para múltiplos clientes
   */
  sendBulkSurveys: protectedProcedure
    .input(
      z.object({
        pesquisaIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Implementar envio em lote
      return { success: true, enviadas: input.pesquisaIds.length };
    }),
});
```

### Passo 2: Registrar Router

**Arquivo**: `server/routers.ts`

```typescript
import { whatsappRouter } from "./routers/whatsapp";

export const appRouter = router({
  // ... outros routers
  whatsapp: whatsappRouter,
});
```

### Passo 3: Adicionar Botão no Dashboard

**Arquivo**: `client/src/components/SurveysList.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SurveysList() {
  const sendWhatsappMutation = trpc.whatsapp.sendSurveyLink.useMutation();

  const handleSendWhatsapp = async (
    telefone: string,
    token: string,
    nome: string
  ) => {
    await sendWhatsappMutation.mutateAsync({
      telefone,
      pesquisaToken: token,
      clienteNome: nome,
    });
  };

  return (
    <div className="space-y-4">
      {/* Lista de pesquisas */}
      <Button
        onClick={() => handleSendWhatsapp("11987654321", "token123", "João")}
        className="flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Enviar via WhatsApp
      </Button>
    </div>
  );
}
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# .env.local
WHATSAPP_API_TOKEN=seu-token-aqui
WHATSAPP_PHONE_NUMBER_ID=seu-phone-id-aqui
```

---

## Padrões de Código

### Padrão 1: Criar Novo Endpoint tRPC

```typescript
// server/routers/exemplo.ts

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

export const exemploRouter = router({
  // Query: Buscar dados
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // ctx.tenantId garante isolamento multi-tenant
      // ctx.user contém informações do usuário autenticado

      const items = await db
        .select()
        .from(sua_tabela)
        .where(eq(sua_tabela.tenant_id, ctx.tenantId))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      return { items, page: input.page };
    }),

  // Mutation: Modificar dados
  create: protectedProcedure
    .input(
      z.object({
        nome: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const id = crypto.randomUUID();
      await db.insert(sua_tabela).values({
        id,
        tenant_id: ctx.tenantId,
        nome: input.nome,
        created_at: new Date(),
      });

      return { success: true, id };
    }),
});
```

### Padrão 2: Usar Endpoint no Frontend

```typescript
// client/src/components/MeuComponente.tsx

import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export default function MeuComponente() {
  // Query: Buscar dados
  const listQuery = trpc.exemplo.list.useQuery({
    page: 1,
    limit: 20,
  });

  // Mutation: Modificar dados
  const createMutation = trpc.exemplo.create.useMutation();

  const handleCreate = async (nome: string) => {
    await createMutation.mutateAsync({ nome });

    // Invalidar query para recarregar
    listQuery.refetch();
  };

  if (listQuery.isLoading) return <div>Carregando...</div>;
  if (listQuery.error) return <div>Erro: {listQuery.error.message}</div>;

  return (
    <div>
      {listQuery.data?.items.map((item) => (
        <div key={item.id}>{item.nome}</div>
      ))}
    </div>
  );
}
```

### Padrão 3: Tratamento de Erros

```typescript
// Sempre validar tenant_id
if (pesquisa.tenant_id !== ctx.tenantId) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Você não tem permissão para acessar este recurso",
  });
}

// Sempre verificar se banco está disponível
const db = await getDb();
if (!db) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Banco de dados indisponível",
  });
}

// Sempre fazer log de erros
console.error("[Feature] Error doing something:", error);
```

---

## Debugging

### Ativar Logs Detalhados

```bash
# Terminal 1: Servidor com logs
DEBUG=* pnpm dev

# Terminal 2: Acompanhar logs de banco
tail -f .manus-logs/devserver.log
```

### Inspecionar Requisições

```bash
# Usar curl para testar endpoints
curl -X POST http://localhost:3000/api/trpc/exemplo.create \
  -H "Content-Type: application/json" \
  -H "Cookie: [seu-cookie-de-sessão]" \
  -d '{"nome": "Teste"}'
```

### Verificar Banco de Dados

```bash
# Conectar ao Supabase via psql
psql "postgresql://postgres:[password]@[project-id].pooler.supabase.co:6543/postgres"

# Listar tabelas
\dt

# Ver dados
SELECT * FROM pesquisas WHERE tenant_id = 'seu-tenant-id';
```

### Debugar Frontend

```bash
# Abrir DevTools do navegador (F12)
# Ir para aba Network
# Filtrar por "trpc"
# Ver requisições e respostas

# Ou usar React DevTools
# Extensão: https://react-devtools-tutorial.vercel.app/
```

### Verificar Autenticação

```bash
# Ver token JWT
# 1. Abrir DevTools (F12)
# 2. Ir para Application > Cookies
# 3. Procurar por cookie de sessão
# 4. Copiar valor
# 5. Decodificar em https://jwt.io

# Ou via curl
curl http://localhost:3000/api/trpc/auth.me \
  -H "Cookie: [seu-cookie]"
```

---

## Checklist de Modificações

Ao fazer modificações, sempre verifique:

- [ ] TypeScript sem erros: `pnpm check`
- [ ] Testes passam: `pnpm test`
- [ ] Código formatado: `pnpm format`
- [ ] Migrations aplicadas: `pnpm db:push`
- [ ] Servidor inicia: `pnpm dev`
- [ ] Sem erros no console
- [ ] Funcionalidade testada manualmente
- [ ] Commit com mensagem descritiva: `git commit -m "feat: descrição"`

---

## Recursos Úteis

- [tRPC Docs](https://trpc.io/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Última atualização**: 2026-03-21
