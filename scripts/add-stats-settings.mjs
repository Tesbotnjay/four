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
    INSERT INTO settings (key, value) VALUES ('edisi_terbit', '45') ON CONFLICT (key) DO NOTHING;
    INSERT INTO settings (key, value) VALUES ('jumlah_liputan', '320') ON CONFLICT (key) DO NOTHING;
  `);
  console.log("Added stats settings");
} catch (e) {
  console.log(e);
}
await c.end();
