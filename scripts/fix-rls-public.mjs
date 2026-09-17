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
    DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON members;
    CREATE POLICY "Members viewable by public" ON members FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Settings viewable by authenticated users" ON settings;
    CREATE POLICY "Settings viewable by public" ON settings FOR SELECT USING (true);
  `);
  console.log("Updated RLS to allow public access for members and settings");
} catch (e) {
  console.log(e);
}
await c.end();
