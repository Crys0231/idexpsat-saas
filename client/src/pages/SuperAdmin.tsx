import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Apenas busca usuários pendentes. Em produção, você limitaria isso via RLS/admin role.
  const { data: pendingUsers, isLoading, refetch } = trpc.auth.listPendingUsers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const approveMutation = trpc.auth.approveAccess.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // Verifica se o usuário tem permissão para acessar esta página.
  // Idealmente verificamos a "role" do user, mas para este MVP checamos se está autenticado 
  // e podemos assumir que o Admin logado é quem acessa a URL enviada no email.
  if (!isAuthenticated) {
    // Para simplificar a demonstração, exigimos login. 
    // Em cenário real, poderíamos usar um "magic token" enviado no e-mail.
    navigate("/login");
    return null;
  }

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync({ userId });
    } catch (e) {
      console.error("Failed to approve access", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Painel SuperAdmin</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Acesso Pendentes</CardTitle>
            <CardDescription>
              Aprove o acesso à plataforma para novos Tenant Users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : pendingUsers?.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                <CheckCircle className="mx-auto w-10 h-10 mb-2 text-green-500" />
                Nenhuma solicitação pendente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingUsers?.map((u: any) => (
                  <div key={u.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{u.name || "Sem nome"}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs font-medium text-amber-600">
                        <Clock className="w-3 h-3" />
                        <span>Aguardando Aprovação</span>
                      </div>
                    </div>
                    <div>
                      <Button 
                        onClick={() => handleApprove(u.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approveMutation.isPending ? <Loader2 className="animate-spin" /> : "Aprovar Acesso"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
