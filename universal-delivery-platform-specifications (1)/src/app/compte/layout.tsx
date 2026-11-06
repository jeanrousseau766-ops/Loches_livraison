import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

/** L'espace personnel suppose un compte créé et une session ouverte. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/connexion?return=/compte");
  return <>{children}</>;
}
