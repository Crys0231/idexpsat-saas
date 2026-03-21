import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  decimal,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ============================================================================
 * MULTI-TENANT SCHEMA FOR IDEXPSAT SATISFACTION SURVEYS
 * ============================================================================
 * 
 * This schema implements a complete multi-tenant architecture for automotive
 * dealership satisfaction surveys with Row Level Security (RLS) isolation.
 * 
 * Key principles:
 * - Every table includes tenant_id for multi-tenant isolation
 * - tenant_id is part of RLS policies to ensure data isolation
 * - UUIDs are used for cross-tenant references
 * - Timestamps track creation and updates
 */

// ============================================================================
// CORE TENANT MANAGEMENT
// ============================================================================

export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ============================================================================
// USER MANAGEMENT (Manus OAuth + Supabase Auth Integration)
// ============================================================================

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: text("name"),
    role: mysqlEnum("role", ["admin", "user", "analyst"]).default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("users_tenant_id_idx").on(table.tenantId),
    openIdIdx: uniqueIndex("users_openid_idx").on(table.openId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// SURVEY CONFIGURATION
// ============================================================================

export const tiposPesquisa = mysqlTable(
  "tipos_pesquisa",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    nome: varchar("nome", { length: 100 }).notNull(), // VENDA, POS_VENDA
    descricao: text("descricao"),
    ativa: boolean("ativa").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("tipos_pesquisa_tenant_id_idx").on(table.tenantId),
    nomeIdx: uniqueIndex("tipos_pesquisa_nome_idx").on(table.tenantId, table.nome),
  })
);

export type TipoPesquisa = typeof tiposPesquisa.$inferSelect;
export type InsertTipoPesquisa = typeof tiposPesquisa.$inferInsert;

export const perguntas = mysqlTable(
  "perguntas",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    tipoPesquisaId: varchar("tipo_pesquisa_id", { length: 36 }).notNull(),
    pergunta: text("pergunta").notNull(),
    tipo: mysqlEnum("tipo", ["escala", "multipla_escolha", "aberta"]).default("escala").notNull(),
    ordem: int("ordem").notNull(),
    ativa: boolean("ativa").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("perguntas_tenant_id_idx").on(table.tenantId),
    tipoPesquisaIdIdx: index("perguntas_tipo_pesquisa_id_idx").on(table.tipoPesquisaId),
  })
);

export type Pergunta = typeof perguntas.$inferSelect;
export type InsertPergunta = typeof perguntas.$inferInsert;

// ============================================================================
// VEHICLE & BRAND MANAGEMENT
// ============================================================================

export const marcas = mysqlTable(
  "marcas",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    nome: varchar("nome", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("marcas_tenant_id_idx").on(table.tenantId),
    nomeIdx: uniqueIndex("marcas_nome_idx").on(table.tenantId, table.nome),
  })
);

export type Marca = typeof marcas.$inferSelect;
export type InsertMarca = typeof marcas.$inferInsert;

export const veiculos = mysqlTable(
  "veiculos",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    placa: varchar("placa", { length: 20 }).notNull(),
    modelo: varchar("modelo", { length: 100 }),
    marcaId: varchar("marca_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("veiculos_tenant_id_idx").on(table.tenantId),
    placaIdx: uniqueIndex("veiculos_placa_idx").on(table.tenantId, table.placa),
    marcaIdIdx: index("veiculos_marca_id_idx").on(table.marcaId),
  })
);

export type Veiculo = typeof veiculos.$inferSelect;
export type InsertVeiculo = typeof veiculos.$inferInsert;

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

export const clientes = mysqlTable(
  "clientes",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    telefone: varchar("telefone", { length: 20 }).notNull(),
    cidade: varchar("cidade", { length: 100 }),
    email: varchar("email", { length: 255 }),
    telegramChatId: text("telegram_chat_id"),
    whatsappId: varchar("whatsapp_id", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("clientes_tenant_id_idx").on(table.tenantId),
    telefoneIdx: uniqueIndex("clientes_telefone_idx").on(table.tenantId, table.telefone),
  })
);

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// ============================================================================
// PURCHASE TRACKING
// ============================================================================

export const compras = mysqlTable(
  "compras",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    clienteId: varchar("cliente_id", { length: 36 }).notNull(),
    veiculoId: varchar("veiculo_id", { length: 36 }).notNull(),
    tipoPesquisaId: varchar("tipo_pesquisa_id", { length: 36 }).notNull(),
    dataCompra: date("data_compra").notNull(),
    hashCompra: varchar("hash_compra", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("compras_tenant_id_idx").on(table.tenantId),
    clienteIdIdx: index("compras_cliente_id_idx").on(table.clienteId),
    veiculoIdIdx: index("compras_veiculo_id_idx").on(table.veiculoId),
    hashCompraIdx: uniqueIndex("compras_hash_compra_idx").on(table.tenantId, table.hashCompra),
  })
);

export type Compra = typeof compras.$inferSelect;
export type InsertCompra = typeof compras.$inferInsert;

// ============================================================================
// SURVEY MANAGEMENT
// ============================================================================

export const pesquisas = mysqlTable(
  "pesquisas",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    compraId: varchar("compra_id", { length: 36 }).notNull(),
    tipoPesquisaId: varchar("tipo_pesquisa_id", { length: 36 }).notNull(),
    token: varchar("token", { length: 36 }).notNull().unique(),
    respondida: boolean("respondida").default(false).notNull(),
    enviada: boolean("enviada").default(false).notNull(),
    dataEnvio: timestamp("data_envio"),
    dataResposta: timestamp("data_resposta"),
    expiraEm: timestamp("expira_em"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("pesquisas_tenant_id_idx").on(table.tenantId),
    compraIdIdx: index("pesquisas_compra_id_idx").on(table.compraId),
    tokenIdx: uniqueIndex("pesquisas_token_idx").on(table.token),
    respondidasIdx: index("pesquisas_respondida_idx").on(table.respondida),
  })
);

export type Pesquisa = typeof pesquisas.$inferSelect;
export type InsertPesquisa = typeof pesquisas.$inferInsert;

// ============================================================================
// SURVEY RESPONSES
// ============================================================================

export const respostas = mysqlTable(
  "respostas",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    pesquisaId: varchar("pesquisa_id", { length: 36 }).notNull(),
    perguntaId: varchar("pergunta_id", { length: 36 }).notNull(),
    resposta: text("resposta"),
    score: int("score"), // For scale questions (1-10)
    sentimento: mysqlEnum("sentimento", ["positivo", "negativo", "neutro"]),
    temas: text("temas"), // JSON array of extracted themes from LLM analysis
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("respostas_tenant_id_idx").on(table.tenantId),
    pesquisaIdIdx: index("respostas_pesquisa_id_idx").on(table.pesquisaId),
    perguntaIdIdx: index("respostas_pergunta_id_idx").on(table.perguntaId),
  })
);

export type Resposta = typeof respostas.$inferSelect;
export type InsertResposta = typeof respostas.$inferInsert;

// ============================================================================
// NOTIFICATION HISTORY
// ============================================================================

export const notificacoes = mysqlTable(
  "notificacoes",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    userId: int("user_id").notNull(),
    pesquisaId: varchar("pesquisa_id", { length: 36 }).notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    conteudo: text("conteudo").notNull(),
    lida: boolean("lida").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("notificacoes_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("notificacoes_user_id_idx").on(table.userId),
    pesquisaIdIdx: index("notificacoes_pesquisa_id_idx").on(table.pesquisaId),
  })
);

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;

// ============================================================================
// ANALYTICS & INSIGHTS (Cached for performance)
// ============================================================================

export const analyticsCache = mysqlTable(
  "analytics_cache",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    tenantId: varchar("tenant_id", { length: 36 }).notNull(),
    metrica: varchar("metrica", { length: 100 }).notNull(), // taxa_resposta, nps, satisfacao_marca, etc
    valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
    dataInicio: date("data_inicio").notNull(),
    dataFim: date("data_fim").notNull(),
    filtros: text("filtros"), // JSON object with filter criteria
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("analytics_cache_tenant_id_idx").on(table.tenantId),
    metricaIdx: index("analytics_cache_metrica_idx").on(table.metrica),
  })
);

export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = typeof analyticsCache.$inferInsert;

// ============================================================================
// RELATIONS (Drizzle ORM)
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  tiposPesquisa: many(tiposPesquisa),
  marcas: many(marcas),
  veiculos: many(veiculos),
  clientes: many(clientes),
  compras: many(compras),
  pesquisas: many(pesquisas),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const tiposPesquisaRelations = relations(tiposPesquisa, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tiposPesquisa.tenantId],
    references: [tenants.id],
  }),
  perguntas: many(perguntas),
  compras: many(compras),
}));

export const perguntasRelations = relations(perguntas, ({ one, many }) => ({
  tipoPesquisa: one(tiposPesquisa, {
    fields: [perguntas.tipoPesquisaId],
    references: [tiposPesquisa.id],
  }),
  respostas: many(respostas),
}));

export const marcasRelations = relations(marcas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [marcas.tenantId],
    references: [tenants.id],
  }),
  veiculos: many(veiculos),
}));

export const veiculosRelations = relations(veiculos, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [veiculos.tenantId],
    references: [tenants.id],
  }),
  marca: one(marcas, {
    fields: [veiculos.marcaId],
    references: [marcas.id],
  }),
  compras: many(compras),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [clientes.tenantId],
    references: [tenants.id],
  }),
  compras: many(compras),
}));

export const comprasRelations = relations(compras, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [compras.tenantId],
    references: [tenants.id],
  }),
  cliente: one(clientes, {
    fields: [compras.clienteId],
    references: [clientes.id],
  }),
  veiculo: one(veiculos, {
    fields: [compras.veiculoId],
    references: [veiculos.id],
  }),
  tipoPesquisa: one(tiposPesquisa, {
    fields: [compras.tipoPesquisaId],
    references: [tiposPesquisa.id],
  }),
  pesquisas: many(pesquisas),
}));

export const pesquisasRelations = relations(pesquisas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [pesquisas.tenantId],
    references: [tenants.id],
  }),
  compra: one(compras, {
    fields: [pesquisas.compraId],
    references: [compras.id],
  }),
  tipoPesquisa: one(tiposPesquisa, {
    fields: [pesquisas.tipoPesquisaId],
    references: [tiposPesquisa.id],
  }),
  respostas: many(respostas),
  notificacoes: many(notificacoes),
}));

export const respostasRelations = relations(respostas, ({ one }) => ({
  pesquisa: one(pesquisas, {
    fields: [respostas.pesquisaId],
    references: [pesquisas.id],
  }),
  pergunta: one(perguntas, {
    fields: [respostas.perguntaId],
    references: [perguntas.id],
  }),
}));

export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  pesquisa: one(pesquisas, {
    fields: [notificacoes.pesquisaId],
    references: [pesquisas.id],
  }),
}));

export const analyticsCacheRelations = relations(analyticsCache, ({ one }) => ({
  tenant: one(tenants, {
    fields: [analyticsCache.tenantId],
    references: [tenants.id],
  }),
}));
