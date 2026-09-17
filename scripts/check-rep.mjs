import pg from 'pg'
const c = new pg.Client({host:'aws-0-ap-southeast-2.pooler.supabase.com',port:5432,database:'postgres',user:'postgres.waptqzihambwhsqgtuzl',password:'Jurnfourteen1!',ssl:{rejectUnauthorized:false}})
await c.connect()
const {rows}=await c.query("SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'")
console.log(rows)
await c.end()
