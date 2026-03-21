# IDExpSat SaaS - Project TODO

## Phase 2: Configurar Schema Supabase com RLS
- [x] Criar tabelas no Supabase (tenants, users, clientes, veículos, marcas, tipos_pesquisa, compras, pesquisas, perguntas, respostas)
- [x] Configurar Row Level Security (RLS) para isolamento de dados por tenant_id
- [x] Criar políticas RLS para cada tabela
- [x] Configurar índices e constraints de integridade referencial

## Phase 3: Implementar Autenticação Multi-tenant
- [x] Integrar Supabase Auth com JWT
- [x] Extrair tenant_id do JWT e adicionar ao contexto
- [x] Criar middleware de autenticação multi-tenant
- [x] Implementar protectedProcedure com validação de tenant_id
- [ ] Criar página de login com redirecionamento pós-autenticação

## Phase 4: Criar API para Ingestão de CSV
- [x] Endpoint POST /api/upload para receber arquivo CSV
- [x] Parser de CSV com extração de tipo_pesquisa (VD/PV) do nome do arquivo
- [x] Lógica de processamento: clientes, veículos, marcas, compras
- [x] Geração de hash_compra único para evitar duplicatas
- [x] Validação de dados e tratamento de erros
- [ ] Testes de ingestão com dados de exemplo

## Phase 5: Página Pública de Resposta de Pesquisa
- [x] Criar rota pública /pesquisa/[token] acessível sem autenticação
- [x] Validar token e carregar dados da pesquisa
- [x] Buscar perguntas baseado em tipo_pesquisa
- [x] Renderizar formulário dinâmico de perguntas
- [x] Enviar respostas para tabela respostas
- [x] Marcar pesquisa como respondida
- [x] Página de sucesso após envio

## Phase 6: Dashboard Tenant
- [ ] Layout dashboard com sidebar navigation
- [ ] Página principal com resumo de pesquisas
- [ ] Tabela de pesquisas respondidas com filtros
- [ ] Visualização de detalhes de pesquisa individual
- [ ] Página de upload de CSV
- [ ] Gerenciamento de tipos de pesquisa e perguntas

## Phase 7: KPIs e Analytics
- [ ] Calcular taxa de resposta (respondidas/total)
- [ ] Calcular NPS (Net Promoter Score)
- [ ] Análise de satisfação por marca
- [ ] Análise de satisfação por tipo de pesquisa
- [ ] Gráficos de tendências temporais
- [ ] Integração com LLM para análise de sentimento
- [ ] Extração automática de temas de respostas abertas
- [ ] Dashboard visual com charts e métricas

## Phase 8: Notificações Automáticas
- [ ] Configurar sistema de notificações ao tenant
- [ ] Enviar notificação quando pesquisa for respondida
- [ ] Incluir resumo da avaliação na notificação
- [ ] Link direto para dashboard na notificação
- [ ] Página de histórico de notificações

## Phase 9: Documentação
- [x] Documentação de setup Supabase (RLS, variáveis de ambiente) - INTEGRATION_GUIDE.md
- [x] Guia de configuração completo com passo a passo - SETUP_GUIDE.md
- [x] Instruções de deploy na Vercel - DEPLOYMENT_GUIDE.md
- [x] Guia de uso e modificações de código - USAGE_GUIDE.md
- [x] README com visão geral da arquitetura - README_PROJECT.md
- [x] Guia de integração com WhatsApp (estrutura preparada)

## Completed Features
- [x] Projeto Next.js inicializado com Supabase
