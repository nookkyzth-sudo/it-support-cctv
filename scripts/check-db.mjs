import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing database connection string. Set DIRECT_URL or DATABASE_URL.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"
  );
  console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

  const branches = await pool.query("SELECT * FROM branches");
  console.log("Branches:", JSON.stringify(branches.rows, null, 2));

  const categories = await pool.query("SELECT * FROM categories");
  console.log("Categories:", JSON.stringify(categories.rows, null, 2));

  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  console.log("Users count:", usersCount.rows[0].count);

  const ticketsCount = await pool.query("SELECT COUNT(*) FROM tickets");
  console.log("Tickets count:", ticketsCount.rows[0].count);
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error("Error:", message);
} finally {
  await pool.end();
}
