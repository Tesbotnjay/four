import pg from 'pg';
const c = new pg.Client({
  host:'aws-0-ap-southeast-2.pooler.supabase.com',
  port:5432,
  database:'postgres',
  user:'postgres.waptqzihambwhsqgtuzl',
  password:'Jurnfourteen1!',
  ssl:{rejectUnauthorized:false}
});
await c.connect();
try {
  await c.query(`
    ALTER TABLE members ADD COLUMN IF NOT EXISTS display_username TEXT;
  `);
  console.log("Added display_username column");
} catch (e) {
  console.log(e);
}
await c.end();
