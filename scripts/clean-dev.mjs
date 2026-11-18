#!/usr/bin/env node
// Removes what the check script leaves behind: everything whose slug starts
// with "smoke-" in the LOCAL tables. It refuses to run unless the table prefix
// is "dev_", so it can never touch what people saved.
//
//   node --env-file=.env.local scripts/clean-dev.mjs

import { neon } from "@neondatabase/serverless";

const prefix = process.env.HUB_TABLE_PREFIX;
if (prefix !== "dev_") {
  console.error(`HUB_TABLE_PREFIX is ${JSON.stringify(prefix)}, not "dev_". Nothing was touched.`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/clean-dev.mjs");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const like = "smoke-%";
const [before] = await sql.query("SELECT count(*)::int AS n FROM dev_harnesses WHERE slug LIKE $1", [like]);
await sql.transaction([
  sql.query("DELETE FROM dev_runs WHERE slug LIKE $1", [like]),
  sql.query("DELETE FROM dev_roles WHERE slug LIKE $1", [like]),
  sql.query("DELETE FROM dev_suggestions WHERE slug LIKE $1", [like]),
  sql.query("DELETE FROM dev_versions WHERE slug LIKE $1", [like]),
  sql.query("DELETE FROM dev_harnesses WHERE slug LIKE $1", [like]),
]);
console.log(`Removed ${before.n} test items from the local tables.`);
