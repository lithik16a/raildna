"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Form";
import { request } from "@/services/apiClient";

const DEMO = { email: "engineer@raildna.demo", password: "raildna-demo" };

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(creds: { email: string; password: string }) {
    setError(null);
    setLoading(true);
    try {
      await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit({ email, password });
      }}
      className="space-y-4"
      noValidate
    >
      {error && <ErrorBanner message={error} />}
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="engineer@raildna.demo" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Button type="submit" loading={loading} className="w-full">
        Sign in
      </Button>
      <div className="relative py-1 text-center text-xs text-slate-400">
        <span className="bg-white px-2">or</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" />
      </div>
      <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={() => void submit(DEMO)}>
        Continue as Demo Field Engineer
      </Button>
      <p className="text-center text-xs text-slate-500">
        Demo account: <code className="rounded bg-slate-100 px-1">{DEMO.email}</code> / <code className="rounded bg-slate-100 px-1">{DEMO.password}</code>
      </p>
    </form>
  );
}
