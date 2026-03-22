import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

/**
 * ============================================================================
 * FIRST ACCESS PAGE
 * ============================================================================
 *
 * Página para o primeiro acesso do usuário tenant criado anteriormente na base.
 * Ele define uma senha e notifica o superadmin.
 */

// Import tRPC client if available, using native fetch for simplicity if needed,
// but assuming standard full-stack setup, you can use the api.
// For robust standalone, we can do a POST to /api/trpc/auth.requestAccess

export default function FirstAccess() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFirstAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usando chamada fetch padrão para a rota tRPC
      const response = await fetch('/api/trpc/auth.requestAccess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, tenantName }),
      });

      if (!response.ok) {
        let msg = "Erro ao solicitar acesso";
        try {
          const errData = await response.json();
          msg = errData.error?.message || msg;
        } catch(e) {}
        throw new Error(msg);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar acesso");
    } finally {
      if (!success) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">IDExpSat</h1>
          <p className="text-slate-600 mt-2">Primeiro Acesso</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurar Senha</CardTitle>
            <CardDescription>
              Crie a sua senha. Uma notificação será enviada para o administrador aprovar o seu acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFirstAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Nome da Concessionária
                </label>
                <Input
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Sua Concessionária"
                  disabled={loading || success}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Seu Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={loading || success}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Crie uma Senha
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  disabled={loading || success}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 font-medium">Solicitação enviada com sucesso!</p>
                  </div>
                  <p className="text-xs text-green-800 ml-8">Aguarde a aprovação do administrador para fazer login. Redirecionando...</p>
                </div>
              )}

              <Button type="submit" disabled={loading || success} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Solicitar Acesso"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Já possui acesso aprovado?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
