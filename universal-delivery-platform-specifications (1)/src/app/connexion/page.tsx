"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, toast, notifyAuthChange } from "@/lib/client";
import { Field, Spinner } from "@/components/ui";
import { BrandMark } from "@/components/Brand";

function safeReturn(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const prive = sp.get("prive") === "1";

  const doLogin = async (p: string, pw: string) => {
    setBusy(true);
    setErr("");
    try {
      const res = await api<{ role: string; status?: string }>("login", { pseudo: p, password: pw });
      notifyAuthChange();
      toast(`Bienvenue, ${p} !`);
      const ret = safeReturn(sp.get("return"));
      router.replace(ret || (res.role === "livreur" ? "/livreur" : res.role === "commercant" ? "/commercant" : res.role === "admin" ? "/admin" : "/compte"));
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {prive && (
        <div className="anim-pop mb-5 rounded-2xl border border-grape/30 bg-grape/8 px-5 py-4 text-sm font-bold text-ink">
          🔒 Espace privé : connectez-vous avec un compte autorisé. Aucun accès de démonstration n'est proposé ici.
        </div>
      )}
      <div className="card grid overflow-hidden lg:grid-cols-[1fr_1.1fr]">
        <div className="relative bg-night p-8 text-cream grain">
          <div className="relative">
            <BrandMark size={42} />
            <h1 className="mt-5 font-display text-3xl font-black leading-tight">Heureux de vous revoir dans la Cité.</h1>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              WawanPost protège chaque espace : les clients commandent après création du compte,
              les livreurs et commerçants travaillent après validation, et l'administration reste privée.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <div className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-3">
                <p className="font-extrabold text-ambre">🛍️ Client</p>
                <p className="mt-1 text-xs text-cream/65">Espace personnel activé dès la création du compte.</p>
              </div>
              <div className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-3">
                <p className="font-extrabold text-ambre">🛵 Livreur · 🏪 Commerçant</p>
                <p className="mt-1 text-xs text-cream/65">Tableau de bord activé uniquement après vérification administrative du dossier.</p>
              </div>
              <div className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-3">
                <p className="font-extrabold text-ambre">🛡️ Administration</p>
                <p className="mt-1 text-xs text-cream/65">Accès réservé aux comptes autorisés. Actions journalisées.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <h2 className="font-display text-2xl font-black">Connexion</h2>
          <p className="mt-1 text-sm text-ink-soft">Pas encore de compte ? <Link href="/inscription" className="font-extrabold text-vermillon-deep underline">Créez-le en 10 secondes</Link> — pseudonyme + mot de passe, c'est tout.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              doLogin(pseudo, password);
            }}
          >
            <Field label="Pseudonyme">
              <input className="input" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="votre pseudo" autoComplete="username" />
            </Field>
            <Field label="Mot de passe">
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </Field>
            {err && <p className="rounded-xl bg-danger/8 px-4 py-2.5 text-sm font-bold text-danger">{err}</p>}
            <button type="submit" className="btn-primary w-full !py-3.5" aria-busy={busy} disabled={busy || !pseudo.trim() || !password}>
              {busy ? <Spinner /> : "Se connecter →"}
            </button>
            <Link href="/inscription" className="btn-ghost w-full !py-3">Créer un compte client</Link>
          </form>
          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            <Link href="/livreur?apply=1" className="card p-4 transition hover:border-river/50">
              <p className="text-sm font-extrabold">🛵 Devenir livreur</p>
              <p className="mt-1 text-xs text-ink-soft">Candidature + validation administrative</p>
            </Link>
            <Link href="/commercant?apply=1" className="card p-4 transition hover:border-leaf/50">
              <p className="text-sm font-extrabold">🏪 Inscrire mon commerce</p>
              <p className="mt-1 text-xs text-ink-soft">0 % de commission sur vos produits</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12"><div className="skeleton h-96" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
