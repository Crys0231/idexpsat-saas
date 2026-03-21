import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react";

/**
 * ============================================================================
 * CSV UPLOAD COMPONENT
 * ============================================================================
 *
 * Handles CSV file uploads for survey creation
 */

export default function CSVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const uploadMutation = trpc.csv.uploadAndProcess.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setFile(null);
      setTimeout(() => setSuccess(false), 5000);
    },
    onError: (err) => {
      setError(err.message || "Failed to upload file");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      const content = await file.text();
      await uploadMutation.mutateAsync({
        filename: file.name,
        content,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-600 mb-4">
          Selecione um arquivo CSV com dados de clientes
        </p>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="max-w-xs mx-auto"
        />
      </div>

      {file && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Arquivo selecionado: <strong>{file.name}</strong>
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Arquivo processado com sucesso!</p>
            <p className="text-sm text-green-700 mt-1">
              As pesquisas foram criadas e os tokens foram gerados.
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploadMutation.isPending}
        className="w-full"
      >
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          "Enviar e Processar"
        )}
      </Button>
    </div>
  );
}
