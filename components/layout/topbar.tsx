"use client";

import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard EN 1090",
  "/commesse": "Commesse",
  "/documenti": "Documenti",
  "/checklist": "Checklist EN 1090",
  "/materiali": "Materiali",
  "/wps": "WPS",
  "/wpqr": "WPQR",
  "/saldatori": "Saldatori",
  "/nc": "Non conformità",
  "/attrezzature": "Attrezzature",
  "/audit": "Audit interni",
  "/piani-controllo": "Piani di controllo",
  "/tracciabilita": "Tracciabilità materiali",
  "/report": "Reportistica",
};

function titleFromPath(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = pathname.match(/^\/commesse\/([^/]+)/);
  if (match) return `Commessa`;
  if (/^\/checklist\//.test(pathname)) return "Dettaglio checklist";
  if (/^\/nc\//.test(pathname)) return "Dettaglio NC";
  if (/^\/saldatori\//.test(pathname)) return "Saldatore";
  if (/^\/documenti\//.test(pathname)) return "Documento";
  if (/^\/materiali\//.test(pathname)) return "Materiale";
  if (/^\/wps\//.test(pathname)) return "WPS";
  if (/^\/wpqr\//.test(pathname)) return "WPQR";
  if (/^\/tracciabilita\//.test(pathname)) return "Tracciabilità";
  if (/^\/audit\//.test(pathname)) return "Audit";
  if (/^\/piani-controllo\//.test(pathname)) return "Piano di controllo";
  if (/^\/report\//.test(pathname)) return "Report commessa";
  return "EN 1090";
}

export function Topbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const title = titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50 md:text-lg">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <MobileMenu />
        <Button type="button" variant="secondary" onClick={() => logout()}>
          Esci
        </Button>
      </div>
    </header>
  );
}
