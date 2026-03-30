"use client";

import { StatCard } from "@/components/sections/stat-card";
import { Card } from "@/components/ui/card";
import { Table, type Column } from "@/components/ui/table";
import {
  loadDashboardData,
  type DashboardDeadline,
  type DashboardPayload,
} from "@/lib/dashboard-data";
import { EN1090_FLOW_STEPS } from "@/lib/en1090-modules";
import { formatDate } from "@/lib/format";
import type { Audit, NonConformita, Qualifica } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const deadlineColumns: Column<DashboardDeadline>[] = [
  {
    key: "tipo",
    header: "Tipo",
    render: (r) => (
      <span className="text-zinc-600 dark:text-zinc-400">{r.tipo}</span>
    ),
  },
  {
    key: "titolo",
    header: "Oggetto",
    render: (r) =>
      r.href ? (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={r.href}
        >
          {r.titolo}
        </Link>
      ) : (
        r.titolo
      ),
  },
  {
    key: "data",
    header: "Data",
    render: (r) => formatDate(r.data),
  },
];

const ncColumns: Column<NonConformita>[] = [
  {
    key: "titolo",
    header: "Titolo",
    render: (r) => (
      <Link
        className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        href={`/nc/${r.id}`}
      >
        {String(r.titolo ?? "—")}
      </Link>
    ),
  },
  { key: "stato", header: "Stato", render: (r) => String(r.stato ?? "—") },
  {
    key: "gravita",
    header: "Gravità",
    render: (r) => String(r.gravita ?? "—"),
  },
];

const auditColumns: Column<Audit>[] = [
  {
    key: "titolo",
    header: "Titolo",
    render: (r) => (
      <Link
        className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        href={`/audit/${r.id}`}
      >
        {String(r.titolo ?? "—")}
      </Link>
    ),
  },
  {
    key: "data",
    header: "Data",
    render: (r) =>
      formatDate(
        (r.dataProgrammata as string | undefined) ??
          (r.data_programmata as string | undefined) ??
          (r.data as string | undefined)
      ),
  },
  { key: "esito", header: "Esito", render: (r) => String(r.esito ?? "—") },
];

const qualColumns: Column<Qualifica>[] = [
  {
    key: "nome",
    header: "Personale",
    render: (r) => (
      <Link
        className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        href={`/saldatori/${r.id}`}
      >
        {`${String(r.nome ?? "")} ${String(r.cognome ?? "")}`.trim() ||
          String(r.nome ?? "—")}
      </Link>
    ),
  },
  {
    key: "scad",
    header: "Scadenza",
    render: (r) =>
      formatDate(
        (r.scadenza as string | undefined) ??
          (r.dataScadenza as string | undefined) ??
          (r.data_scadenza as string | undefined)
      ) || "—",
  },
  { key: "ruolo", header: "Ruolo", render: (r) => String(r.ruolo ?? "—") },
];

function ReportRapidiSection({ data }: { data: DashboardPayload }) {
  const r = data.reportDashboard?.riepilogo;
  const gen = data.reportDashboard?.generatedAt;

  return (
    <Card
      title="Report rapidi"
      description={
        gen
          ? `Ultimo aggiornamento aggregato: ${formatDate(gen) ?? gen}`
          : "Dati da GET /report/dashboard"
      }
      actions={
        <Link
          href="/report"
          className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          Report completi
        </Link>
      }
    >
      {r ? (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Commesse (tot.)", r.commesseTotal],
            ["Commesse attive", r.commesseAttive],
            ["Materiali", r.materialiTotal],
            ["Documenti", r.documentiTotal],
            ["NC aperte", r.nonConformitaAperte],
            ["NC chiuse", r.nonConformitaChiuse],
            ["Audit (tot.)", r.auditTotal],
            ["Audit non conformi", r.auditNonConformi],
            ["WPS (tot.)", r.wpsTotal],
            ["WPQR in scadenza (90gg)", r.wpqrInScadenza90gg],
          ].map(([k, v]) => (
            <div
              key={String(k)}
              className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {k}
              </dt>
              <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {v ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Report dashboard non disponibile. Verifica il backend e il token JWT.
        </p>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await loadDashboardData();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Errore caricamento dashboard"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Caricamento dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card title="Dashboard">
        <p className="text-sm text-red-600">
          {error ??
            "Dati non disponibili. Verifica che l’API sia raggiungibile (NEXT_PUBLIC_API_URL) e che il backend sia attivo."}
        </p>
      </Card>
    );
  }

  const ultimiNc = data.reportDashboard?.ultimeNonConformita ?? [];
  const ultimiAud = data.reportDashboard?.ultimiAudit ?? [];

  return (
    <div className="space-y-8">
      <Card
        title="Flusso operativo EN 1090"
        description="Dalla commessa ai controlli, alla documentazione, tracciabilità e sintesi — ordine consigliato per uso in stabilimento (concetti generali, non testo normativo)."
      >
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EN1090_FLOW_STEPS.map((step) => (
            <li
              key={step.step}
              className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-900 dark:bg-sky-950 dark:text-sky-100">
                {step.step}
              </span>
              <div className="min-w-0">
                <Link
                  href={step.moduleHref}
                  className="font-medium text-sky-800 hover:underline dark:text-sky-300"
                >
                  {step.title}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Indicatori (API)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            icon="📋"
            label="Commesse attive"
            value={data.commesseAttive}
            href="/commesse"
            hint="Non chiuse (stato ≠ CHIUSA)"
          />
          <StatCard
            icon="✅"
            label="Commesse completate"
            value={data.commesseCompletate}
            href="/commesse"
            hint="Stato CHIUSA"
          />
          <StatCard
            icon="⚠️"
            label="NC aperte"
            value={data.nonConformitaAperte.length}
            href="/nc"
            hint="GET /non-conformita?status=open"
          />
          <StatCard
            icon="📄"
            label="Materiali senza certificato"
            value={data.materialiSenzaCertificato.length}
            href="/materiali"
            hint="GET /materiali?missingCert=true"
          />
          <StatCard
            icon="☑️"
            label="Checklist incomplete"
            value={data.checklistIncomplete.length}
            href="/checklist"
            hint="GET /checklist?status=incomplete"
          />
          <StatCard
            icon="🔍"
            label="Audit programmati"
            value={data.auditProgrammati.length}
            href="/audit"
            hint="GET /audit?status=pending"
          />
          <StatCard
            icon="👷"
            label="Qualifiche in scadenza"
            value={data.qualificheInScadenza.length}
            href="/saldatori"
            hint="GET /qualifiche?expiresSoon=true"
          />
          <StatCard
            icon="🔧"
            label="WPS in scadenza"
            value={data.wpsInScadenza.length}
            href="/wps"
            hint="GET /wps?expiresSoon=true"
          />
          <StatCard
            icon="📎"
            label="WPQR in scadenza"
            value={data.wpqrInScadenza.length}
            href="/wpqr"
            hint="GET /wpqr?expiresSoon=true"
          />
          <StatCard
            icon="📐"
            label="Piani di controllo attivi"
            value={data.pianiControlloAttivi.length}
            href="/piani-controllo"
            hint="GET /piani-controllo?status=open"
          />
          <StatCard
            icon="📑"
            label="Documenti in scadenza"
            value={data.documentiInScadenza.length}
            href="/documenti"
            hint="Elenco locale (60gg)"
          />
        </div>
      </div>

      <Card
        title="Stato commesse"
        description={`Totale anagrafiche: ${data.commesseTotal} · ${data.certificazioneStato}`}
      >
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Attive</p>
            <p className="text-3xl font-semibold tabular-nums text-sky-800 dark:text-sky-200">
              {data.commesseAttive}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">
              Completate
            </p>
            <p className="text-3xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
              {data.commesseCompletate}
            </p>
          </div>
          <Link
            href="/commesse"
            className="self-end text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
          >
            Vai alle commesse →
          </Link>
        </div>
      </Card>

      <ReportRapidiSection data={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Prossime scadenze"
          description="Documenti, WPS, WPQR e qualifiche — ordinate per data"
        >
          <Table
            columns={deadlineColumns}
            data={data.scadenzeUnificate}
            emptyMessage="Nessuna scadenza imminente nei criteri selezionati."
            getRowKey={(r, i) => `${r.tipo}-${i}-${r.data}`}
          />
        </Card>
        <Card title="Collegamenti rapidi" description="Moduli del gestionale">
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["/commesse", "Commesse"],
              ["/materiali", "Materiali"],
              ["/documenti", "Documenti"],
              ["/checklist", "Checklist"],
              ["/piani-controllo", "Piani di controllo"],
              ["/wps", "WPS"],
              ["/wpqr", "WPQR"],
              ["/saldatori", "Saldatori"],
              ["/attrezzature", "Attrezzature"],
              ["/tracciabilita", "Tracciabilità"],
              ["/nc", "Non conformità"],
              ["/audit", "Audit"],
              ["/report", "Report"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  className="text-sky-700 hover:underline dark:text-sky-400"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Elementi critici
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title="Non conformità aperte"
            description="Elenco da GET /non-conformita?status=open (raffinato lato client)"
          >
            <Table
              columns={ncColumns}
              data={data.nonConformitaAperte.slice(0, 12)}
              emptyMessage="Nessuna NC aperta."
              getRowKey={(r) => r.id}
            />
          </Card>
          <Card
            title="Audit FPC programmati"
            description="GET /audit?status=pending"
          >
            <Table
              columns={auditColumns}
              data={data.auditProgrammati.slice(0, 12)}
              emptyMessage="Nessun audit in attesa."
              getRowKey={(r) => r.id}
            />
          </Card>
          <Card
            title="Qualifiche saldatori in scadenza"
            description="GET /qualifiche?expiresSoon=true"
          >
            <Table
              columns={qualColumns}
              data={data.qualificheInScadenza.slice(0, 12)}
              emptyMessage="Nessuna scadenza imminente."
              getRowKey={(r) => r.id}
            />
          </Card>
        </div>
      </div>

      {(ultimiNc.length > 0 || ultimiAud.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {ultimiNc.length > 0 ? (
            <Card
              title="Ultime NC (report)"
              description="Ultime 5 da GET /report/dashboard"
            >
              <ul className="space-y-2 text-sm">
                {ultimiNc.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/nc/${n.id}`}
                      className="font-medium text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {String(n.titolo ?? n.id)}
                    </Link>
                    <span className="text-zinc-500">
                      {" "}
                      — {String(n.stato ?? "—")}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {ultimiAud.length > 0 ? (
            <Card
              title="Ultimi audit (report)"
              description="Ultimi 5 da GET /report/dashboard"
            >
              <ul className="space-y-2 text-sm">
                {ultimiAud.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/audit/${a.id}`}
                      className="font-medium text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {String(a.titolo ?? a.id)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
