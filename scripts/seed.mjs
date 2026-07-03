import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

const branches = [
  ["NINE", "กลาง"],
  ["AY", "เหนือ"],
  ["LCK", "ใต้"],
  ["HIPB", "ตะวันออก"],
  ["PK", "กลาง"],
  ["CTI", "ใต้"],
  ["UBT", "ตะวันออก"],
];

const categories = ["CCTV", "PC/CPU", "UPS", "Internet", "Printer", "Other"];

try {
  for (const [name, zone] of branches) {
    await pool.query(
      "INSERT INTO branches (branch_name, zone) VALUES ($1, $2) ON CONFLICT (branch_name) DO NOTHING",
      [name, zone]
    );
  }

  for (const name of categories) {
    await pool.query(
      "INSERT INTO categories (category_name) VALUES ($1) ON CONFLICT (category_name) DO NOTHING",
      [name]
    );
  }

  console.log("Seed completed successfully");
} catch (e) {
  console.error("Seed error:", e.message);
} finally {
  await pool.end();
}
