import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        emoji="🔒"
        title="Accès non autorisé"
        text="Cet espace est privé ou réservé à un rôle précis. Connectez-vous avec un compte autorisé, ou revenez à votre espace personnel."
      >
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link href="/compte" className="btn-primary">Mon espace</Link>
          <Link href="/connexion" className="btn-ghost">Changer de compte</Link>
        </div>
      </EmptyState>
    </div>
  );
}
