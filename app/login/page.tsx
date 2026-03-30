"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔥 Redirect automatico se già autenticata
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // 🔥 Se già autenticata, non mostrare la pagina
  if (isAuthenticated) {
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login(email.trim(), password);

      const token =
        data.access_token ??
        (data as { accessToken?: string }).accessToken ??
        data.token ??
        "";

      if (!token) {
        setError("Risposta login senza token. Controlla il formato del backend.");
        return;
      }

      login(token);

      // 🔥 Redirect sicuro (evita errori removeChild)
      router.push("/dashboard");

    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Accesso non riuscito. Verifica credenziali e che il backend sia attivo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-sky-900 dark:text-sky-200">
            EN 1090
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Accedi al sistema di gestione qualità e fabbricazione
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Accesso in corso…" : "Accedi"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          API:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            POST /auth/login
          </code>
        </p>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        <Link href="/" className="text-sky-700 hover:underline dark:text-sky-400">
          Torna alla home
        </Link>
      </p>
    </div>
  );
}

