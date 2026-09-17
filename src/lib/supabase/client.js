import { createBrowserClient } from '@supabase/ssr'

let client = null

export function createClient() {
  if (client) return client
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // During build time, return a mock client that won't crash
  if (!url || !key || url === 'your_supabase_url_here' || !url.startsWith('http')) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } }),
        signOut: async () => ({}),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: async () => ({ data: [], error: null }) }) }), order: () => ({ limit: async () => ({ data: [], error: null }) }), data: [], error: null }),
        insert: async () => ({ data: null, error: null }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
      channel: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
      removeChannel: () => {},
    }
  }

  client = createBrowserClient(url, key)
  return client
}
