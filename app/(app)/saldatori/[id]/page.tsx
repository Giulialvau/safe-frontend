"use client";

import {
  QualificaFormFields,
  emptyQualificaForm,
  type QualificaFormState,
} from "../form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { qualificheApi } from "@/lib/api/endpoints";
import { ApiError, apiPatch } from "@/lib/api/client";
import { extractObject } from "@/lib/api/extract-object";
import { formatDate } from "@/lib/format";
import type { Qualifica } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function toIn(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function SaldatoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");

  const [row, setRow] = useState<Qualifica | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<QualificaFormState>(emptyQualificaForm());

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const raw = await qualificheApi.get(id);
      if (!raw) {
        setError("Qualifica non trovata");
        return;
      }
      setRow(raw);
      setForm({
        nome: String(raw.nome ?? ""),
        ruolo: String(raw.ruolo ?? ""),
        scadenza: toIn(
          (raw.scadenza as string | undefined) ??
            (raw.dataScadenza as string | undefined) ??
            (raw.data_scadenza as string | undefined)
        ),
        documento: String(raw.documento ?? raw.documentoUrl ?? ""),
      });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento qualifica"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.ruolo.trim()) {
      setSaveError("Nome e ruolo sono obbligatori.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        ruolo: form.ruolo.trim(),
        scadenza: form.scadenza
          ? new Date(form.scadenza).toISOString()
          : undefined,
        documento: form.documento.trim() || undefined,
      };
      const raw = await apiPatch<unknown>(`/qualifiche/${id}`, body);
      extractObject<Qualifica>(raw);
      await load();
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Eliminare questa qualifica?")) return;
    try {
      await qualificheApi.remove(id);
      router.replace("/saldatori");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  if (loading && !row) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (error && !row) {
    return (
      <Card title="Errore">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/saldatori"
          className="mt-2 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna all&apos;elenco
        </Link>
      </Card>
    );
  }

  if (!row) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/saldatori" className="text-sky-700 hover:underline">
              Saldatori
            </Link>{" "}
            / {form.nome || id}
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {String(row.nome ?? row.cognome ?? "Qualifica")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Scadenza:{" "}
            {formatDate(
              (row.scadenza as string | undefined) ??
                (row.dataScadenza as string | undefined) ??
                (row.data_scadenza as string | undefined)
            ) || "—"}
          </p>
        </div>
        <Button type="button" variant="ghost" className="text-red-700" onClick={() => void remove()}>
          Elimina
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card title="Modifica anagrafica" description="PATCH /qualifiche/:id">
        <form className="space-y-4" onSubmit={save}>
          {saveError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          ) : null}
          <QualificaFormFields form={form} setForm={setForm} />
          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio…" : "Salva"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
