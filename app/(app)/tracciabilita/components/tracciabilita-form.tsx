"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tracciabilitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Commessa, Materiale, TracciabilitaRecord } from "@/types";
import { useEffect, useState } from "react";

const empty = {
  materialeId: "",
  commessaId: "",
  posizione: "",
  quantita: "",
  descrizioneComponente: "",
  riferimentoDisegno: "",
  note: "",
};

function formatQty(q: unknown): string {
  if (q === null || q === undefined) return "—";
  if (typeof q === "number") return String(q);
  return String(q);
}

export type TracciabilitaFormProps = {
  variant: "commessa" | "global";
  /** Per variant commessa è l’ID fisso commessa */
  commessaIdFixed?: string;
  commesse?: Commessa[];
  materiali: Materiale[];
  /** Voce in modifica o null per creazione */
  editing: TracciabilitaRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
  formId?: string;
  /** Se false, niente pulsanti in coda (es. footer nel Modal) */
  showActions?: boolean;
  /** Global: pre-seleziona commessa (es. da filtro URL) */
  initialCommessaId?: string;
  /** Global: notifica cambio commessa per caricare i materiali lato parent */
  onCommessaChange?: (commessaId: string) => void;
};

export function TracciabilitaForm({
  variant,
  commessaIdFixed,
  commesse = [],
  materiali,
  editing,
  onSuccess,
  onCancel,
  formId = "form-tracciabilita",
  showActions = true,
  initialCommessaId,
  onCommessaChange,
}: TracciabilitaFormProps) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setForm({
        ...empty,
        commessaId:
          variant === "commessa"
            ? (commessaIdFixed ?? "")
            : (initialCommessaId?.trim() ?? ""),
      });
      return;
    }
    setForm({
      materialeId: String(editing.materialeId ?? editing.materiale_id ?? ""),
      commessaId: String(editing.commessaId ?? editing.commessa_id ?? ""),
      posizione: String(editing.posizione ?? ""),
      quantita: formatQty(editing.quantita).replace("—", ""),
      descrizioneComponente: String(
        editing.descrizioneComponente ?? editing.descrizione_componente ?? ""
      ),
      riferimentoDisegno: String(
        editing.riferimentoDisegno ?? editing.riferimento_disegno ?? ""
      ),
      note: String(editing.note ?? ""),
    });
  }, [editing, variant, commessaIdFixed, initialCommessaId]);

  const effectiveCommessaId =
    variant === "commessa" ? (commessaIdFixed ?? "") : form.commessaId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cid =
      variant === "commessa"
        ? (commessaIdFixed ?? "").trim()
        : form.commessaId.trim();
    if (!cid) {
      setError("Seleziona una commessa.");
      return;
    }
    const mid = form.materialeId.trim();
    if (!mid) {
      setError("Seleziona un materiale della commessa.");
      return;
    }
    const qty = Number(form.quantita.replace(",", "."));
    if (Number.isNaN(qty) || qty < 0) {
      setError("Quantità non valida.");
      return;
    }
    if (!form.posizione.trim()) {
      setError("Indica la posizione o il riferimento di installazione.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        commessaId: cid,
        materialeId: mid,
        posizione: form.posizione.trim(),
        quantita: qty,
        descrizioneComponente: form.descrizioneComponente.trim() || undefined,
        riferimentoDisegno: form.riferimentoDisegno.trim() || undefined,
        note: form.note.trim() || undefined,
      };
      if (editing) {
        const { commessaId: _c, ...patch } = body;
        await tracciabilitaApi.update(editing.id, patch);
      } else {
        await tracciabilitaApi.create(body);
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id={formId} className="space-y-3" onSubmit={submit}>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {variant === "global" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Commessa *
          </label>
          <select
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            value={form.commessaId}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({
                ...f,
                commessaId: v,
                materialeId: "",
              }));
              onCommessaChange?.(v);
            }}
            disabled={Boolean(editing)}
          >
            <option value="">— Seleziona —</option>
            {commesse.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codice ?? c.id} — {c.cliente ?? ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Materiale (lotto) *
        </label>
        <select
          required
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          value={form.materialeId}
          onChange={(e) =>
            setForm((f) => ({ ...f, materialeId: e.target.value }))
          }
          disabled={Boolean(editing)}
        >
          <option value="">
            {effectiveCommessaId
              ? "— Seleziona materiale —"
              : "— Prima la commessa —"}
          </option>
          {materiali.map((m) => (
            <option key={m.id} value={m.id}>
              {m.codice} — {m.descrizione}
              {m.lotto ? ` (lotto ${m.lotto})` : ""}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Posizione / installazione *"
        name="posizione"
        value={form.posizione}
        onChange={(e) => setForm((f) => ({ ...f, posizione: e.target.value }))}
        required
        placeholder="es. Asse 3, Montante B2, Piano +7.50"
      />
      <Input
        label="Quantità *"
        name="quantita"
        type="text"
        inputMode="decimal"
        value={form.quantita}
        onChange={(e) => setForm((f) => ({ ...f, quantita: e.target.value }))}
        required
      />
      <Input
        label="Descrizione componente"
        name="descrizioneComponente"
        value={form.descrizioneComponente}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            descrizioneComponente: e.target.value,
          }))
        }
        placeholder="Collegamento lotto → componente prodotto"
      />
      <Input
        label="Riferimento disegno"
        name="riferimentoDisegno"
        value={form.riferimentoDisegno}
        onChange={(e) =>
          setForm((f) => ({ ...f, riferimentoDisegno: e.target.value }))
        }
        placeholder="es. DWG-2025-118 rev.B"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Note
        </label>
        <textarea
          name="note"
          rows={3}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </div>

      {showActions ? (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio…" : "Salva collegamento"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
