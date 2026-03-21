import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * ============================================================================
 * ANALYTICS COMPONENT
 * ============================================================================
 *
 * Displays analytics, KPIs, and sentiment analysis
 */

export default function Analytics() {
  const statsQuery = trpc.surveys.getStatistics.useQuery();

  if (statsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (statsQuery.error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erro ao carregar analytics: {statsQuery.error.message}
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Total de Pesquisas</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalSurveys || 0}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Pesquisas Respondidas</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.respondedSurveys || 0}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Taxa de Resposta</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.responseRate || 0}%</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Satisfação Média</p>
          <p className="text-2xl font-bold text-slate-900">{stats?.averageScore || 0}/10</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Análise de sentimento e gráficos serão implementados em breve com integração de LLM.
        </p>
      </div>
    </div>
  );
}
