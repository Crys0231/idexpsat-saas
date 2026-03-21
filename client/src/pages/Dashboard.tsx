import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Settings } from "lucide-react";
import { useState } from "react";
import CSVUpload from "@/components/CSVUpload";
import SurveysList from "@/components/SurveysList";
import Analytics from "@/components/Analytics";

/**
 * ============================================================================
 * TENANT DASHBOARD
 * ============================================================================
 *
 * Main dashboard for authenticated tenant users.
 * Displays surveys, analytics, and management tools.
 */

export default function Dashboard() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState("surveys");

  if (loading) {
    return <DashboardLayout>Carregando...</DashboardLayout>;
  }

  if (!user) {
    return <DashboardLayout>Acesso negado</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard de Pesquisas</h1>
          <p className="text-slate-600 mt-1">Gerencie suas pesquisas de satisfação e visualize analytics</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Pesquisas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">Pesquisas criadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Taxa de Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-slate-500 mt-1">Pesquisas respondidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">NPS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-slate-500 mt-1">Net Promoter Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="surveys" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Pesquisas
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload CSV
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Surveys Tab */}
          <TabsContent value="surveys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pesquisas Respondidas</CardTitle>
                <CardDescription>
                  Visualize todas as pesquisas respondidas pelos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SurveysList />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Arquivo CSV</CardTitle>
                <CardDescription>
                  Carregue um arquivo CSV com dados de clientes e veículos para criar pesquisas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVUpload />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics e KPIs</CardTitle>
                <CardDescription>
                  Visualize métricas de satisfação e análise de sentimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Analytics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
