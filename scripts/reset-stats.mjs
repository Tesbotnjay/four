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
    UPDATE settings SET value = '0' WHERE key IN ('edisi_terbit', 'jumlah_liputan');
  `);
  console.log("Reset stats to 0");
} catch (e) {
  console.log(e);
}
await c.end();
