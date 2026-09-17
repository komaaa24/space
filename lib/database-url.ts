export function getPgAdapterConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return { connectionString };
  }

  const url = new URL(connectionString);
  const isLocalHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const requiresSsl = url.searchParams.get("sslmode") === "require" || !isLocalHost;

  return {
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  };
}
