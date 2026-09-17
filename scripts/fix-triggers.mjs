import pg from 'pg'

const client = new pg.Client({
  host: 'aws-0-ap-southeast-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.waptqzihambwhsqgtuzl',
  password: 'Jurnfourteen1!',
  ssl: { rejectUnauthorized: false },
})

async function run() {
  await client.connect()
  console.log('Connected!')

  // Create function
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)
  console.log('✓ Function update_updated_at_column created')

  // Create triggers
  const tables = ['members', 'activities', 'attendance', 'leave_requests', 'broadcasts', 'announcements']
  for (const t of tables) {
    try {
      await client.query(`
        CREATE TRIGGER update_${t}_updated_at
        BEFORE UPDATE ON ${t}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log(`✓ Trigger for ${t}`)
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log(`~ Trigger for ${t} (already exists)`)
      } else {
        console.log(`✗ Trigger for ${t}: ${e.message}`)
      }
    }
  }

  // Enable realtime for key tables
  const realtimeTables = ['attendance', 'notifications', 'announcements', 'broadcasts', 'activities']
  for (const t of realtimeTables) {
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE ${t};`)
      console.log(`✓ Realtime enabled for ${t}`)
    } catch (e) {
      if (e.message.includes('already')) {
        console.log(`~ Realtime for ${t} (already enabled)`)
      } else {
        console.log(`✗ Realtime for ${t}: ${e.message}`)
      }
    }
  }

  await client.end()
  console.log('\n✅ All done!')
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
