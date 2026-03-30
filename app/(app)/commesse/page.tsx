"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import {
  CommessaFormFields,
  commessaFormToCreateBody,
  type CommessaFormState,
} from "./form";
import { commesseApi, type CommesseListParams } from "@/lib/api/endpoints";
import { ApiError, apiPost } from "@/lib/api/client";
import { extractObject } from "@/lib/api/extract-object";
import { formatDate } from "@/lib/format";
import type { Commessa } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATI = [
  { value: "", label: "Tutti gli stati" },
  { value: "BOZZA", label: "Bozza" },
  { value: "IN_CORSO", label: "In corso" },
  { value: "SOSPESA", label: "Sospesa" },
  { value: "CHIUSA", label: "Chiusa" },
];

const EMPTY_FILTERS: CommesseListParams = {
  stato: "",
  cliente: "",
  dataInizioDa: "",
  dataInizioA: "",
};

function buildListParams(f: CommesseListParams): CommesseListParams | undefined {
  const params: CommesseListParams = {};
  if (f.stato) params.stato = f.stato;
  if (f.cliente?.trim()) params.cliente = f.cliente.trim();
  if (f.dataInizioDa) params.dataInizioDa = f.dataInizioDa;
  if (f.dataInizioA) params.dataInizioA = f.dataInizioA;
  return Object.keys(params).length ? params : undefined;
}

export default function CommessePage() {
  const [rows, setRows] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  /** Errori di caricamento / filtri elenco (rete, 4xx, formato). */
  const [error, setError] = useState<string | null>(null);
  /** Solo salvataggio nuova commessa (modal). */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [filters, setFilters] = useState<CommesseListParams>({ ...EMPTY_FILTERS });

  const [search, setSearch] = useState("");

  const [form, setForm] = useState<CommessaFormState>({
    codice: "",
    titolo: "",
    cliente: "",
    descrizione: "",
    responsabile: "",
    luogo: "",
    note: "",
    dataInizio: "",
    dataFine: "",
    stato: "BOZZA",
  });

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        String(r.codice ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r.cliente ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r.titolo ?? r.nome ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [rows, search]);

  const fetchList = useCallback(async (f: CommesseListParams) => {
    setError(null);
    setLoading(true);
    try {
      const list = await commesseApi.list(buildListParams(f));
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "Non è stato possibile caricare l’elenco. Controlla la connessione e riprova.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList({ ...EMPTY_FILTERS });
  }, [fetchList]);

  const tableEmptyMessage = useMemo(() => {
    if (rows.length === 0) {
      return "Nessuna commessa";
    }
    if (filteredRows.length === 0) {
      return "Nessuna commessa corrisponde alla ricerca o ai filtri correnti.";
    }
    return "Nessun dato";
  }, [rows.length, filteredRows.length]);

  const columns: Column<Commessa>[] = [
    {
      key: "codice",
      header: "Codice",
      render: (r) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {String(r.codice ?? r.id)}
        </span>
      ),
    },
    { key: "cliente", header: "Cliente", render: (r) => String(r.cliente ?? "—") },
    {
      key: "data",
      header: "Data",
      render: (r) => formatDate(r.dataInizio as string | undefined) || "—",
    },
    { key: "stato", header: "Stato", render: (r) => String(r.stato ?? "—") },
    {
      key: "apri",
      header: "",
      render: (r) => (
        <Link
          href={`/commesse/${r.id}`}
          className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:bg-sky-900"
        >
          Apri
        </Link>
      ),
    },
  ];

  async function createCommessa(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setSaveError(null);
    try {
      const body = commessaFormToCreateBody(form);
      const raw = await apiPost<unknown>("/commesse", body);
      extractObject<Commessa>(raw);
      setModalOpen(false);
      setForm({
        codice: "",
        titolo: "",
        cliente: "",
        descrizione: "",
        responsabile: "",
        luogo: "",
        note: "",
        dataInizio: "",
        dataFine: "",
        stato: "BOZZA",
      });
      await fetchList(filters);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Creazione commessa non riuscita"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title="Commesse"
        description="Entità centrale: ogni ordine di fabbricazione aggrega materiali, documenti, controlli e tracciabilità EN 1090."
        actions={
          <Button
            type="button"
            onClick={() => {
              setSaveError(null);
              setModalOpen(true);
            }}
          >
            Nuova commessa
          </Button>
        }
      >
        <div className="mb-4">
          <Input
            label="Ricerca rapida (codice, cliente, titolo)"
            name="search-commesse"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digita per filtrare l’elenco caricato…"
          />
        </div>

        <div className="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Stato
            </label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={filters.stato ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, stato: e.target.value }))
              }
            >
              {STATI.map((s) => (
                <option key={s.value || "all"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Cliente (contiene)"
            name="filter-cliente"
            value={filters.cliente ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, cliente: e.target.value }))
            }
            placeholder="Filtra per testo"
          />
          <Input
            label="Data inizio da"
            name="filter-da"
            type="date"
            value={filters.dataInizioDa ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dataInizioDa: e.target.value }))
            }
          />
          <Input
            label="Data inizio a"
            name="filter-a"
            type="date"
            value={filters.dataInizioA ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dataInizioA: e.target.value }))
            }
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void fetchList(filters)}
            >
              Applica filtri
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFilters({ ...EMPTY_FILTERS });
                void fetchList({ ...EMPTY_FILTERS });
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {error ? (
          <div
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            {error}
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-zinc-500">Caricamento…</p>
        ) : (
          <Table
            columns={columns}
            data={filteredRows}
            getRowKey={(r) => r.id}
            emptyMessage={tableEmptyMessage}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Nuova commessa"
        onClose={() => {
          setModalOpen(false);
          setSaveError(null);
        }}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setSaveError(null);
              }}
            >
              Annulla
            </Button>
            <Button type="submit" form="form-commessa" disabled={creating}>
              {creating ? "Salvataggio…" : "Crea"}
            </Button>
          </>
        }
      >
        <form id="form-commessa" className="space-y-3" onSubmit={createCommessa}>
          {saveError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          ) : null}
          <CommessaFormFields form={form} setForm={setForm} showStato />
        </form>
      </Modal>
    </div>
  );
}
