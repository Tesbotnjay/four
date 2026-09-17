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
  const {rows} = await c.query("SELECT id, user_id, username, role FROM members");
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.log(e);
}
await c.end();
