"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentiApi } from "@/lib/api/endpoints";
import { API_BASE_URL, ApiError } from "@/lib/api/client";
import { useCallback, useState } from "react";

export type UploadDocumentResult = {
  id: string;
  nome: string;
  /** URL assoluto `GET /documenti/:id/download` (richiede JWT in fetch) */
  url: string;
};

const ACCEPT =
  "application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/gif,.gif,image/webp,.webp";

export type UploadDocumentProps = {
  commessaId: string;
  /** Titolo logico (campo `title` nel multipart) */
  defaultTitle?: string;
  tipo?: string;
  versione?: string;
  onSuccess?: (result: UploadDocumentResult) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  submitLabel?: string;
  /** Se false, il titolo viene preso dal nome file al submit */
  showTitleInput?: boolean;
};

export function UploadDocument({
  commessaId,
  defaultTitle = "",
  tipo,
  versione,
  onSuccess,
  onError,
  disabled,
  className,
  submitLabel = "Carica",
  showTitleInput = true,
}: UploadDocumentProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!commessaId.trim()) {
        onError?.("Seleziona una commessa valida.");
        return;
      }
      if (!file) {
        onError?.("Seleziona un file PDF o un’immagine.");
        return;
      }
      const resolvedTitle = showTitleInput
        ? title.trim()
        : (file.name || "documento").replace(/\.[^.]+$/, "");
      if (!resolvedTitle) {
        onError?.("Inserisci un titolo.");
        return;
      }
      setUploading(true);
      try {
        const doc = await documentiApi.upload({
          file,
          title: resolvedTitle,
          commessaId: commessaId.trim(),
          tipo,
          versione,
        });
        const id = String(doc.id);
        const nome = String(doc.nome ?? (doc as { titolo?: string }).titolo ?? resolvedTitle);
        onSuccess?.({
          id,
          nome,
          url: `${API_BASE_URL}/documenti/${id}/download`,
        });
        setFile(null);
        if (showTitleInput) setTitle("");
      } catch (err) {
        onError?.(
          err instanceof ApiError
            ? err.message
            : "Upload non riuscito. Riprova."
        );
      } finally {
        setUploading(false);
      }
    },
    [
      commessaId,
      file,
      onError,
      onSuccess,
      showTitleInput,
      tipo,
      title,
      versione,
    ]
  );

  return (
    <form className={className} onSubmit={handleSubmit}>
      {showTitleInput ? (
        <Input
          label="Titolo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Es. Certificato 3.1 lotto 42"
          required
          disabled={disabled || uploading}
          autoComplete="off"
        />
      ) : null}
      <div className="mt-3 flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          File (PDF o immagine)
        </label>
        <input
          type="file"
          accept={ACCEPT}
          disabled={disabled || uploading}
          className="text-sm file:mr-2 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1 dark:file:bg-zinc-800"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="mt-4">
        <Button type="submit" disabled={disabled || uploading || !commessaId}>
          {uploading ? "Caricamento…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
