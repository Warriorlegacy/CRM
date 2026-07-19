const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:Piyushrajput@db.iynilxlxxhbutyentjcj.supabase.co:5432/postgres"
});

async function main() {
  await client.connect();
  try {
    // Mark both failed migrations as rolled back
    const toRollback = [
      '20260704000003_add_agent_collision_detection',
      '20260704000004_add_internal_notes',
    ];
    for (const name of toRollback) {
      const r = await client.query(`
        UPDATE "_prisma_migrations"
        SET rolled_back_at = NOW(), finished_at = NULL, logs = 'Manually resolved'
        WHERE migration_name = $1 AND finished_at IS NULL AND rolled_back_at IS NULL
      `, [name]);
      console.log(`Rolled back ${name}: ${r.rowCount} rows updated`);
    }

    // Print current states
    const res = await client.query(`SELECT migration_name, rolled_back_at, finished_at FROM "_prisma_migrations" ORDER BY started_at`);
    console.log("\nMigration states:");
    for (const row of res.rows) {
      const state = row.finished_at ? 'APPLIED' : row.rolled_back_at ? 'ROLLED_BACK' : 'FAILED';
      console.log(`  ${state}: ${row.migration_name}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
