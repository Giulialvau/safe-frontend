"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EN1090_NAV_SECTIONS } from "@/lib/en1090-modules";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        Menu
      </Button>
      <Modal open={open} title="Navigazione" onClose={() => setOpen(false)}>
        <div className="space-y-5">
          {EN1090_NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
                        onClick={() => setOpen(false)}
                        title={item.description}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                          active
                            ? "bg-sky-50 text-sky-900 dark:bg-sky-950/50"
                            : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
        </div>
      </Modal>
    </>
  );
}
