import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

/** Espace privé : aucun tableau de bord ni formulaire de démo n'est rendu publiquement. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/connexion?return=/admin&prive=1");
  if (user.role !== "admin" || user.status !== "active") redirect("/acces-refuse");
  return <>{children}</>;
}
