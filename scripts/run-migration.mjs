import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Use pooler (session mode, port 5432) which has IPv4
const client = new pg.Client({
  host: 'aws-0-ap-southeast-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.waptqzihambwhsqgtuzl',
  password: 'Jurnfourteen1!',
  ssl: { rejectUnauthorized: false },
})

async function runMigration() {
  console.log('Connecting to Supabase via pooler (IPv4)...')
  await client.connect()
  console.log('✅ Connected!\n')

  const sqlFile = join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')
  const fullSQL = readFileSync(sqlFile, 'utf8')

  // Split into statements and run one by one
  const statements = fullSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => {
      const clean = s.replace(/--.*$/gm, '').trim()
      return clean.length > 3
    })

  console.log(`Found ${statements.length} statements to execute\n`)

  let ok = 0, skip = 0, fail = 0
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const clean = stmt.replace(/--.*$/gm, '').trim()
    if (!clean) continue

    const label = clean.substring(0, 65).replace(/\n/g, ' ').replace(/\s+/g, ' ')
    process.stdout.write(`[${i + 1}/${statements.length}] ${label}... `)

    try {
      await client.query(clean + ';')
      console.log('✓')
      ok++
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate')) {
        console.log('~ (exists)')
        skip++
      } else {
        console.log('✗')
        console.log(`   Error: ${e.message}`)
        fail++
      }
    }
  }

  console.log(`\n========================================`)
  console.log(`Results: ${ok} succeeded, ${skip} skipped, ${fail} failed`)

  // Verify tables
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `)
  console.log(`\n📋 Tables created (${rows.length}):`)
  rows.forEach(r => console.log(`  ✓ ${r.table_name}`))

  await client.end()
  console.log('\n✅ Done!')
}

runMigration().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
