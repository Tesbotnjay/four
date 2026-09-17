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
  await c.query("ALTER TABLE members ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;");
  console.log("Added links column");
  
  // Create bucket for avatars
  await c.query(`
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('avatars', 'avatars', true) 
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log("Created bucket");

  // Create RLS for avatars bucket
  await c.query(`
    CREATE POLICY "Avatar Images are publicly accessible." 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'avatars' );
    
    CREATE POLICY "Anyone can upload an avatar." 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'avatars' );
    
    CREATE POLICY "Anyone can update their avatar." 
    ON storage.objects FOR UPDATE 
    USING ( bucket_id = 'avatars' );
  `);
  console.log("Created policies");
} catch (e) {
  console.log(e);
}
await c.end();
