import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * ============================================================================
 * PUBLIC SURVEY RESPONSE PAGE
 * ============================================================================
 *
 * Accessible via token: /pesquisa/[token]
 * Allows customers to answer surveys without authentication
 */

interface Question {
  id: string;
  pergunta: string;
  tipo: "escala" | "multipla_escolha" | "aberta";
  ordem: number;
}

interface SurveyData {
  id: string;
  token: string;
  tipoPesquisaId: string;
  perguntas: Question[];
}

export default function SurveyResponse() {
  const { token } = useParams<{ token: string }>();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch survey data
  const getSurveyQuery = trpc.surveys.getSurveyByToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
      retry: false,
    }
  );

  useEffect(() => {
    if (getSurveyQuery.data) {
      setSurvey(getSurveyQuery.data);
      setLoading(false);
    }
    if (getSurveyQuery.error) {
      setError(getSurveyQuery.error.message || "Failed to load survey");
      setLoading(false);
    }
  }, [getSurveyQuery.data, getSurveyQuery.error]);

  // Submit responses
  const submitMutation = trpc.surveys.submitResponses.useMutation();

  useEffect(() => {
    if (submitMutation.isSuccess) {
      setSubmitted(true);
    }
    if (submitMutation.error) {
      setError(submitMutation.error.message || "Failed to submit survey");
    }
  }, [submitMutation.isSuccess, submitMutation.error]);

  const handleResponseChange = (perguntaId: string, value: string | number) => {
    setResponses((prev) => ({
      ...prev,
      [perguntaId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!survey) return;

    const respostas = survey.perguntas.map((pergunta) => ({
      perguntaId: pergunta.id,
      resposta: String(responses[pergunta.id] || ""),
      score: typeof responses[pergunta.id] === "number" ? (responses[pergunta.id] as number) : undefined,
    }));

    await submitMutation.mutateAsync({
      token: token || "",
      respostas,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erro ao carregar pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Obrigado!</CardTitle>
            <CardDescription className="text-green-600">
              Suas respostas foram registradas com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Agradecemos por dedicar seu tempo para responder esta pesquisa de satisfação. Seu feedback é muito importante para nós!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">Pesquisa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Pesquisa de Satisfação</CardTitle>
            <CardDescription>
              Por favor, responda as perguntas abaixo para nos ajudar a melhorar nossos serviços.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {survey.perguntas.map((pergunta) => (
                <div key={pergunta.id} className="border-b pb-6 last:border-b-0">
                  <label className="block text-sm font-medium text-slate-900 mb-3">
                    {pergunta.ordem}. {pergunta.pergunta}
                  </label>

                  {pergunta.tipo === "escala" && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleResponseChange(pergunta.id, score)}
                          className={`w-10 h-10 rounded border text-sm font-medium transition-colors ${
                            responses[pergunta.id] === score
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-300 hover:border-blue-600"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  )}

                  {pergunta.tipo === "aberta" && (
                    <textarea
                      value={String(responses[pergunta.id] || "")}
                      onChange={(e) => handleResponseChange(pergunta.id, e.target.value)}
                      placeholder="Digite sua resposta aqui..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  )}

                  {pergunta.tipo === "multipla_escolha" && (
                    <div className="space-y-2">
                      {/* TODO: Add options from database */}
                      <p className="text-sm text-slate-500">Opções serão carregadas do banco de dados</p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="flex-1"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Respostas"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
