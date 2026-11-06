import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function InboxLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/connexion?return=/messagerie");
  return <>{children}</>;
}
