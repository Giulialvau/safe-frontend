"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EN1090_NAV_SECTIONS } from "@/lib/en1090-modules";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      <div className="border-b border-zinc-100 px-5 py-5 dark:border-zinc-800">
        <Link href="/dashboard" className="block">
          <span className="text-lg font-bold tracking-tight text-sky-800 dark:text-sky-300">
            EN 1090
          </span>
          <span className="mt-0.5 block text-xs font-medium text-zinc-500">
            Gestione fabbricazione
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {EN1090_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            <p className="mb-1.5 px-px text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.description}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
