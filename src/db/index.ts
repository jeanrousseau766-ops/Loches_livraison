import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Connexion paresseuse : aucun accès à PostgreSQL pendant la compilation.
 * Le client est créé à la première requête, avec les variables du serveur.
 * Cela permet à Vercel de construire le site puis d'afficher un diagnostic
 * explicite dans /api/health si la liaison Neon n'est pas encore configurée.
 */
export class DatabaseConfigurationError extends Error {
  constructor() {
    super(
      "DATABASE_URL manque dans les variables d'environnement du serveur. " +
        "Ajoutez la chaîne de connexion PostgreSQL (Neon), puis redéployez."
    );
    this.name = "DatabaseConfigurationError";
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __lochoDatabase?: NodePgDatabase;
};

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new DatabaseConfigurationError();

  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString,
      // Plusieurs fonctions Vercel peuvent démarrer en parallèle : limiter
      // leurs connexions évite d'épuiser la petite base gratuite Neon.
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

function getDatabase(): NodePgDatabase {
  if (!globalForDb.__lochoDatabase) {
    globalForDb.__lochoDatabase = drizzle(getPool());
  }
  return globalForDb.__lochoDatabase;
}

// Les modules peuvent être importés pendant le build sans variable secrète.
// Seule une vraie opération (select, insert, execute…) ouvre la connexion.
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, property) {
    const client = getPool();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
