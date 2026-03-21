import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * ============================================================================
 * SURVEYS LIST COMPONENT
 * ============================================================================
 *
 * Displays a list of surveys with filtering and pagination
 */

export default function SurveysList() {
  const surveysQuery = trpc.surveys.listSurveys.useQuery({
    page: 1,
    limit: 20,
    respondidas: true,
  });

  if (surveysQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (surveysQuery.error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erro ao carregar pesquisas: {surveysQuery.error.message}
      </div>
    );
  }

  if (!surveysQuery.data?.surveys || surveysQuery.data.surveys.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Nenhuma pesquisa respondida ainda. As pesquisas aparecerão aqui quando os clientes responderem.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Total: {surveysQuery.data.total} pesquisas
      </p>
      {/* TODO: Implement surveys table with details */}
      <p className="text-sm text-slate-500">Tabela de pesquisas será implementada em breve</p>
    </div>
  );
}
