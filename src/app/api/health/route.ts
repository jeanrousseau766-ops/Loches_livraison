import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL?.trim()) {
    return Response.json(
      {
        ok: false,
        error: "DATABASE_URL_missing",
        message:
          "La base n'est pas encore reliée au site. Dans Vercel : Settings → Environment Variables → ajoutez DATABASE_URL avec le lien Neon, puis redéployez.",
      },
      { status: 503 }
    );
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    // Ne jamais renvoyer la chaîne de connexion ni son mot de passe.
    console.error(
      "[health] Connexion PostgreSQL indisponible :",
      error instanceof Error ? error.name : "erreur inconnue"
    );
    return Response.json(
      {
        ok: false,
        error: "database_unavailable",
        message:
          "Le site est construit, mais ne parvient pas à joindre la base. Vérifiez DATABASE_URL dans Vercel et utilisez la chaîne Pooled connection de Neon.",
      },
      { status: 503 }
    );
  }
}
