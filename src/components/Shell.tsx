"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, usePoll, useCart, cartCount, toast, useMounted, AUTH_EVENT, notifyAuthChange } from "@/lib/client";
import type { MeData, PublicData } from "@/lib/types";
import { timeAgo, hoursLabel } from "@/lib/util";
import { Badge, Toasts } from "@/components/ui";
import CheckoutFlow from "@/components/Checkout";
import { BrandMark } from "@/components/Brand";

export { BrandMark } from "@/components/Brand";

const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  livreur: "Livreur",
  commercant: "Commerçant",
  admin: "Admin",
};

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = usePoll<MeData>("me", {}, 9000);
  const pub = usePoll<PublicData>("public", {}, 30000);
  const cart = useCart();
  const mounted = useMounted();
  const [cartOpen, setCartOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const lastNotif = useRef(0);
  const user = me.data?.user ?? null;
  const active = user?.status === "active";

  /* Un seul raccourci « espace » : celui du compte connecté, jamais tous les rôles. */
  const workspaceHref =
    user?.role === "admin" ? "/admin" :
    user?.role === "livreur" ? "/livreur" :
    user?.role === "commercant" ? "/commercant" : "/compte";
  const workspaceLabel =
    user?.role === "admin" ? "Administration" :
    user?.role === "livreur" ? (active ? "Espace livreur" : "Ma candidature") :
    user?.role === "commercant" ? (active ? "Ma boutique" : "Ma candidature") :
    "Mes commandes";
  const workspaceEmoji =
    user?.role === "admin" ? "🛡️" :
    user?.role === "livreur" ? "🛵" :
    user?.role === "commercant" ? "🏪" : "📦";
  const showAdminShortcut = user?.role === "admin" && active;

  useEffect(() => {
    const top = me.data?.notifications?.[0];
    if (top) {
      if (lastNotif.current && top.id > lastNotif.current && !top.read) toast(top.title, "info");
      lastNotif.current = Math.max(lastNotif.current, top.id);
    }
  }, [me.data]);

  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener("locho:cart", open);
    return () => window.removeEventListener("locho:cart", open);
  }, []);

  useEffect(() => {
    const onAuth = () => me.refresh();
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, [me.refresh]);

  useEffect(() => {
    setBellOpen(false);
    setMobileNav(false);
    setUserMenu(false);
  }, [pathname]);

  const openBell = async () => {
    setBellOpen((v) => !v);
    if (!bellOpen && (me.data?.unread ?? 0) > 0) {
      try {
        await api("markRead");
        me.refresh();
      } catch {
        /* silencieux */
      }
    }
  };

  const logout = async () => {
    try {
      await api("logout");
      notifyAuthChange();
      toast("Vous êtes déconnecté·e.", "info");
      me.refresh();
      router.push("/");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  const open = pub.data?.serviceOpen ?? true;
  const cfg = pub.data?.config;
  const count = cartCount(cart);
  const commanderActive = pathname === "/" || pathname.startsWith("/boutique") || pathname.startsWith("/commande") || pathname.startsWith("/compte");

  const mobileItems = [
    { href: "/#commerces", label: "Commerces", emoji: "🏪", active: false },
    { href: "/#resultats", label: "Recherche", emoji: "🔎", active: false },
    user
      ? { href: workspaceHref, label: user.role === "client" ? "Commandes" : "Mon espace", emoji: workspaceEmoji, active: pathname.startsWith(workspaceHref) }
      : { href: "/connexion", label: "Connexion", emoji: "👤", active: pathname === "/connexion" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---------- En-tête fixe ---------- */}
      <header className="fixed inset-x-0 top-0 z-[90] border-b border-line bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <BrandMark />
            <span className="leading-none">
              <span className="font-display text-[20px] font-black tracking-tight">WawanPost</span>
              <span className="mt-0.5 block text-[9px] font-extrabold uppercase tracking-[0.24em] text-ink-soft">
                Loches · 37
              </span>
            </span>
          </Link>

          <nav className="ml-4 hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold transition ${commanderActive ? "bg-ink text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-vermillon" />
              Commander
            </Link>
            <Link href="/#commerces" className="rounded-xl px-3 py-2 text-[13px] font-bold text-ink-soft transition hover:bg-ink/5 hover:text-ink">
              Les commerces
            </Link>
            {user && (user.role !== "admin" || showAdminShortcut) && (
              <Link
                href={workspaceHref}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold transition ${pathname.startsWith(workspaceHref) ? "bg-ink text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}
              >
                <span>{workspaceEmoji}</span>
                {workspaceLabel}
              </Link>
            )}
            {user && (
              <Link href="/messagerie" className={`relative rounded-xl px-3 py-2 text-[13px] font-bold transition ${pathname === "/messagerie" ? "bg-ink text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`}>
                📨 Messages
                {((me.data?.inboxUnread ?? 0) + (me.data?.pollsPending ?? 0)) > 0 && <span className="ml-1.5 rounded-full bg-vermillon px-1.5 text-[10px] text-cream">{(me.data?.inboxUnread ?? 0) + (me.data?.pollsPending ?? 0)}</span>}
              </Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${open ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-ambre/40 bg-ambre/10 text-[#8a5a00]"}`}
              title="Horaires de livraison"
            >
              <span className={`h-2 w-2 rounded-full ${open ? "bg-leaf dot-live" : "bg-ambre"}`} />
              {open ? `Ouvert · ${cfg ? hoursLabel(cfg.openHour, cfg.closeHour) : "04h – 23h"}` : `Fermé · ${cfg ? hoursLabel(cfg.openHour, cfg.closeHour) : "04h – 23h"}`}
            </span>

            {/* Notifications */}
            <div className="relative">
              <button onClick={openBell} className="relative rounded-xl border border-ink/12 bg-cream p-2.5 hover:border-ink/30 transition cursor-pointer" aria-label="Notifications">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {mounted && (me.data?.unread ?? 0) > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-vermillon px-1 text-[10px] font-black text-cream dot-verm">
                    {me.data!.unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 anim-pop card overflow-hidden">
                  <div className="border-b border-line px-4 py-3 text-sm font-extrabold">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {!user && <p className="px-4 py-6 text-center text-sm text-ink-soft">Connectez-vous pour recevoir vos notifications.</p>}
                    {user && (me.data?.notifications.length ?? 0) === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-ink-soft">Aucune notification pour l'instant.</p>
                    )}
                    {user &&
                      me.data?.notifications.map((nt) => (
                        <button
                          key={nt.id}
                          className="block w-full border-b border-line/60 px-4 py-3 text-left hover:bg-paper transition cursor-pointer"
                          onClick={() => {
                            setBellOpen(false);
                            if (nt.orderId) router.push(`/commande/${nt.orderId}`);
                            else if (nt.kind === "message" || nt.kind === "sondage") router.push("/messagerie");
                          }}
                        >
                          <p className="text-[13px] font-extrabold">{nt.title}</p>
                          {nt.body && <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">{nt.body}</p>}
                          <p className="mt-1 text-[10px] font-bold text-ink-soft/70">{timeAgo(nt.createdAt)}</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panier */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl bg-ink p-2.5 text-cream hover:bg-night-2 transition cursor-pointer"
              aria-label="Panier"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6L5 3H2" />
                <circle cx="9" cy="20" r="1.6" />
                <circle cx="18" cy="20" r="1.6" />
              </svg>
              {mounted && count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-vermillon px-1 text-[10px] font-black text-cream">
                  {count}
                </span>
              )}
            </button>

            {/* Compte */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ambre to-vermillon font-display text-sm font-black text-cream ring-2 ring-cream cursor-pointer"
                  aria-label="Mon compte"
                >
                  {(user.displayName || user.pseudo).charAt(0).toUpperCase()}
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-12 z-50 w-60 anim-pop card overflow-hidden">
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-sm font-extrabold truncate">{user.displayName || user.pseudo}</p>
                      <Badge tone={user.role === "admin" ? "grape" : user.role === "livreur" ? "river" : user.role === "commercant" ? "leaf" : "vermillon"} className="mt-1">
                        {ROLE_LABEL[user.role]}{!active && user.role !== "client" ? " · à valider" : ""}
                      </Badge>
                    </div>
                    <div className="p-1.5 text-sm font-bold">
                      <Link href="/compte" className="block rounded-lg px-3 py-2 hover:bg-paper">📦 Mes commandes</Link>
                      <Link href="/messagerie" className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-paper">
                        <span>📨 Messages & sondages</span>
                        {((me.data?.inboxUnread ?? 0) + (me.data?.pollsPending ?? 0)) > 0 && (
                          <span className="rounded-full bg-vermillon px-1.5 text-[10px] text-cream">{(me.data?.inboxUnread ?? 0) + (me.data?.pollsPending ?? 0)}</span>
                        )}
                      </Link>
                      {(user.role !== "admin" || showAdminShortcut) && (
                        <Link href={workspaceHref} className="block rounded-lg px-3 py-2 hover:bg-paper">{workspaceEmoji} {workspaceLabel}</Link>
                      )}
                      <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-danger hover:bg-danger/5 cursor-pointer">
                        ↪ Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/connexion" className="btn-primary !px-3 !py-2 !text-xs sm:!text-sm">
                  <span className="sm:hidden">Connexion</span>
                  <span className="hidden sm:inline">Se connecter</span>
                </Link>
                <Link href="/inscription" className="btn-ghost hidden md:inline-flex !px-3 !py-2 !text-xs">
                  Créer un compte
                </Link>
              </div>
            )}

            <button onClick={() => setMobileNav((v) => !v)} className="lg:hidden rounded-xl border border-ink/12 p-2.5 cursor-pointer" aria-label="Menu">
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                {mobileNav ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileNav && (
          <div className="lg:hidden border-t border-line bg-cream px-4 py-3 anim-pop">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/" className="flex items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm font-bold">🛍️ Commander</Link>
              <Link href="/#commerces" className="flex items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm font-bold">🏪 Les commerces</Link>
              {user ? (
                <>
                  <Link href={workspaceHref} className="flex items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm font-bold">
                    {workspaceEmoji} {workspaceLabel}
                  </Link>
                  <Link href="/messagerie" className="flex items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm font-bold">📨 Messages & sondages</Link>
                </>
              ) : (
                <>
                  <Link href="/connexion" className="btn-primary">Se connecter</Link>
                  <Link href="/inscription" className="btn-ghost">Créer un compte</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ---------- Contenu ---------- */}
      <main className="flex-1 pt-16 pb-20 md:pb-0">{children}</main>

      {/* ---------- Navigation mobile : parcours client uniquement ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-[80] border-t border-line bg-cream/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {mobileItems.map((n) => (
            <Link key={n.label} href={n.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-extrabold ${n.active ? "text-vermillon-deep" : "text-ink-soft"}`}>
              <span className="text-lg leading-none">{n.emoji}</span>
              {n.label}
              <span className={`h-1 w-1 rounded-full ${n.active ? "bg-vermillon" : "bg-transparent"}`} />
            </Link>
          ))}
          <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-extrabold text-ink-soft cursor-pointer">
            <span className="text-lg leading-none">🧺</span>
            Panier
            {mounted && count > 0 && <span className="absolute right-5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-vermillon px-1 text-[9px] text-cream">{count}</span>}
            <span className="h-1 w-1 rounded-full bg-transparent" />
          </button>
        </div>
      </nav>

      {/* ---------- Pied de page ---------- */}
      <footer className="mt-16 hidden md:block bg-night text-cream/80 grain">
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={30} />
              <span className="font-display text-xl font-black text-cream">WawanPost</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              La plateforme de livraison universelle de la Cité royale : repas, courses, fleurs, cadeaux, colis…
              livrés par des indépendants du secteur.
            </p>
            <p className="mt-3 text-xs font-bold text-ambre">🕓 Tous les jours · {cfg ? hoursLabel(cfg.openHour, cfg.closeHour) : "04h – 23h"}</p>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cream/50">WawanPost</p>
            <ul className="mt-3 space-y-2 text-sm font-bold">
              <li><Link className="hover:text-ambre transition" href="/">Commander</Link></li>
              {!user && <li><Link className="hover:text-ambre transition" href="/inscription">Créer un compte</Link></li>}
              <li><Link className="hover:text-ambre transition" href="/compte">Mes commandes</Link></li>
              <li><Link className="hover:text-ambre transition" href="/legal#reclamation">Réclamations</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cream/50">Zone desservie</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(cfg?.zones ?? ["Loches", "Beaulieu-lès-Loches", "Perrusson"]).map((z) => (
                <li key={z}>📍 {z}</li>
              ))}
              <li className="text-xs text-cream/50">Extension progressive aux communes voisines (phase 3).</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cream/50">Informations</p>
            <ul className="mt-3 space-y-2 text-sm font-bold">
              <li><Link className="hover:text-ambre transition" href="/legal#mentions">Mentions légales</Link></li>
              <li><Link className="hover:text-ambre transition" href="/legal#cgv">CGU / CGV</Link></li>
              <li><Link className="hover:text-ambre transition" href="/legal#confidentialite">Confidentialité & RGPD</Link></li>
              <li><Link className="hover:text-ambre transition" href="/legal#produits">Produits réglementés</Link></li>
              <li><Link className="hover:text-ambre transition" href="/legal#wawangame">Crédits & marge</Link></li>
            </ul>
          </div>
        </div>
        <div className="relative border-t border-cream/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-[11px] text-cream/50">
            <span>© 2026 WawanPost — Projet Loches (37). 100 % de la marge plateforme est affectée à la micronation <strong className="text-ambre">wawangame</strong>.</span>
            <span>🔒 Paiements via prestataire agréé multi-vendeurs (mode démonstration) · Données protégées (RGPD)</span>
          </div>
        </div>
      </footer>

      <CheckoutFlow
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        me={me.data}
        pub={pub.data}
        refreshMe={me.refresh}
        onOrdered={(id) => {
          setCartOpen(false);
          router.push(`/commande/${id}`);
        }}
      />
      <Toasts />
    </div>
  );
}
