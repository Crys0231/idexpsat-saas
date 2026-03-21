# IDExpSat SaaS - Migração para Supabase Auth

## 📋 Visão Geral

Este guia documenta a migração do sistema de autenticação de **Manus OAuth** para **Supabase Auth**, permitindo que você tenha controle total sobre a autenticação e integração com o banco de dados.

## ✅ O que foi implementado

### Frontend
- ✅ Cliente Supabase (`client/src/lib/supabase.ts`)
- ✅ Hook de autenticação (`client/src/hooks/useSupabaseAuth.ts`)
- ✅ Contexto de autenticação (`client/src/contexts/AuthContext.tsx`)
- ✅ Página de login (`client/src/pages/Login.tsx`)
- ✅ Página de registro (`client/src/pages/Signup.tsx`)
- ✅ Rotas de autenticação no App.tsx

### Backend
- ✅ Cliente Supabase Admin (`server/_core/supabase.ts`)
- ✅ Funções para gerenciar usuários
- ✅ Variáveis de ambiente atualizadas

---

## 🔧 Configuração do Supabase Auth

### Passo 1: Habilitar Email/Password Auth

1. No Supabase Dashboard, vá para **Authentication > Providers**
2. Procure por **Email** e clique em **Enable**
3. Configure as opções:
   - **Confirm email**: Desabilitar para testes (habilitar em produção)
   - **Double confirm changes**: Desabilitar para testes
   - **Secure email change**: Desabilitar para testes

### Passo 2: Configurar Variáveis de Ambiente

Adicione ao seu `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]
```

### Passo 3: Habilitar RLS no Supabase

1. Vá para **Authentication > Policies**
2. Para cada tabela (users, tenants, pesquisas, etc):
   - Clique em **Enable RLS**
   - Adicione políticas de acesso

---

## 🔐 Fluxo de Autenticação

### 1. Registro (Signup)

```
Usuário preenche formulário
    ↓
Valida email e senha
    ↓
Cria usuário no Supabase Auth
    ↓
Cria tenant no banco
    ↓
Cria usuário no banco com tenant_id
    ↓
Redireciona para login
```

### 2. Login

```
Usuário preenche email/senha
    ↓
Autentica com Supabase Auth
    ↓
Supabase retorna JWT
    ↓
JWT é armazenado no localStorage
    ↓
Redireciona para dashboard
```

### 3. Acesso Protegido

```
Usuário acessa rota protegida
    ↓
Verifica se JWT existe
    ↓
Valida JWT com Supabase
    ↓
Extrai tenant_id do banco
    ↓
Aplica RLS para filtrar dados
```

---

## 📝 Código Implementado

### Cliente Supabase (Frontend)

**Arquivo**: `client/src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Hook de Autenticação

**Arquivo**: `client/src/hooks/useSupabaseAuth.ts`

```typescript
export function useSupabaseAuth(redirectOnUnauthenticated = false) {
  const [authState, setAuthState] = useState<AuthState>({...});
  
  // Verifica sessão e escuta mudanças
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // ...
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, logout };
}
```

### Contexto de Autenticação

**Arquivo**: `client/src/contexts/AuthContext.tsx`

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Verificar sessão e escutar mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### Página de Login

**Arquivo**: `client/src/pages/Login.tsx`

```typescript
export default function Login() {
  const handleLogin = async (e: React.FormEvent) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      navigate("/dashboard", { replace: true });
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <Input type="email" placeholder="seu@email.com" />
      <Input type="password" placeholder="••••••••" />
      <Button type="submit">Entrar</Button>
    </form>
  );
}
```

### Página de Registro

**Arquivo**: `client/src/pages/Signup.tsx`

```typescript
export default function Signup() {
  const handleSignup = async (e: React.FormEvent) => {
    // 1. Criar usuário no Supabase Auth
    const { data: authData } = await supabase.auth.signUp({
      email,
      password,
    });

    // 2. Criar tenant no banco
    await supabase.from("tenants").insert({
      id: tenantId,
      nome: tenantName,
    });

    // 3. Criar usuário no banco com tenant_id
    await supabase.from("users").insert({
      open_id: authData.user.id,
      tenant_id: tenantId,
      email,
    });
  };
  
  return (
    <form onSubmit={handleSignup}>
      <Input placeholder="Nome da Concessionária" />
      <Input type="email" placeholder="seu@email.com" />
      <Input type="password" placeholder="••••••••" />
      <Button type="submit">Criar Conta</Button>
    </form>
  );
}
```

### Cliente Supabase Admin (Backend)

**Arquivo**: `server/_core/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getUserFromJWT(token: string) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function upsertUserInDatabase(userId: string, email: string, tenantId: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .upsert({
      open_id: userId,
      email,
      tenant_id: tenantId,
    })
    .select()
    .single();
  return data;
}
```

---

## 🧪 Testando a Autenticação

### Teste 1: Registro

```bash
# 1. Acesse http://localhost:5173/signup
# 2. Preencha o formulário:
#    - Nome da Concessionária: "Teste ABC"
#    - Email: "teste@exemplo.com"
#    - Senha: "senha123"
# 3. Clique em "Criar Conta"
# 4. Você deve ser redirecionado para login
```

### Teste 2: Login

```bash
# 1. Acesse http://localhost:5173/login
# 2. Preencha com as credenciais criadas
# 3. Clique em "Entrar"
# 4. Você deve ser redirecionado para /dashboard
```

### Teste 3: Verificar JWT

```bash
# 1. Abra DevTools (F12)
# 2. Vá para Application > Cookies
# 3. Procure por "sb-[projeto-id]-auth-token"
# 4. Copie o valor
# 5. Decodifique em https://jwt.io
# 6. Você deve ver:
#    - sub: user_id
#    - email: seu@email.com
#    - aud: authenticated
```

### Teste 4: Verificar Banco de Dados

```bash
# Conectar ao Supabase
psql "postgresql://postgres:[password]@[projeto-id].pooler.supabase.co:6543/postgres"

# Verificar usuário criado
SELECT * FROM users WHERE email = 'teste@exemplo.com';

# Verificar tenant criado
SELECT * FROM tenants;

# Sair
\q
```

---

## 🔄 Integração com tRPC

### Atualizar Contexto tRPC

**Arquivo**: `server/_core/context.ts`

```typescript
import { getUserFromJWT } from "./supabase";

export async function createContext(opts: CreateContextOptions) {
  const token = opts.req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return { user: null, tenantId: null, req: opts.req, res: opts.res };
  }

  const user = await getUserFromJWT(token);
  
  if (!user) {
    return { user: null, tenantId: null, req: opts.req, res: opts.res };
  }

  // Buscar tenant_id do usuário no banco
  const dbUser = await getUserFromDatabase(user.id);
  
  return {
    user,
    tenantId: dbUser?.tenant_id,
    req: opts.req,
    res: opts.res,
  };
}
```

---

## 📚 Variáveis de Ambiente Necessárias

### Desenvolvimento (.env.local)

```bash
# Supabase
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role]

# Database
DATABASE_URL=postgresql://postgres:[password]@[projeto-id].pooler.supabase.co:6543/postgres

# JWT
JWT_SECRET=[sua-chave-secreta]

# Node
NODE_ENV=development
```

### Produção (Vercel)

Adicione as mesmas variáveis no Vercel Dashboard:
**Settings > Environment Variables**

---

## 🚀 Próximos Passos

### 1. Implementar Confirmação de Email

```typescript
// Em Supabase > Authentication > Email Templates
// Customizar template de confirmação com link para seu app
```

### 2. Implementar Reset de Senha

```typescript
// Adicionar página /forgot-password
// Implementar fluxo de reset com Supabase
```

### 3. Implementar Social Login

```typescript
// Supabase suporta: Google, GitHub, Discord, etc
// Habilitar em Authentication > Providers
```

### 4. Implementar MFA

```typescript
// Supabase suporta TOTP
// Habilitar em Authentication > MFA
```

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"

**Solução**: Verifique se as variáveis estão definidas em `.env.local`:
```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Erro: "Invalid login credentials"

**Solução**: Verifique se:
1. Email/senha estão corretos
2. Usuário foi criado com sucesso
3. Email confirmation está desabilitado (para testes)

### Erro: "RLS policy violation"

**Solução**: Verifique se:
1. RLS está habilitado na tabela
2. Políticas estão configuradas corretamente
3. tenant_id do usuário está correto

### Usuário não aparece no dashboard

**Solução**: Verifique se:
1. Usuário foi criado no banco de dados
2. tenant_id foi associado corretamente
3. JWT contém o user_id correto

---

## 📖 Referências

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Email Auth](https://supabase.com/docs/guides/auth/auth-email)

---

## ✨ Resumo das Mudanças

| Componente | Antes (Manus OAuth) | Depois (Supabase Auth) |
|-----------|-------------------|----------------------|
| Autenticação | Manus OAuth | Supabase Auth (Email/Senha) |
| Login | OAuth Callback | Email/Senha Form |
| Registro | Automático via OAuth | Formulário com Tenant |
| JWT | Manus | Supabase |
| Banco | MySQL | PostgreSQL (Supabase) |
| RLS | Manual | Automático via Supabase |
| Sessão | Cookie | JWT + localStorage |

---

**Última atualização**: 2026-03-21
**Versão**: 2.0.0 (Supabase Auth)
