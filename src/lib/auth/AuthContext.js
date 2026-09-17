'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMember = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.warn('Member fetch error (RLS?):', error.message)
        // Fallback: try without RLS via API
        try {
          const res = await fetch(`/api/members/me?user_id=${userId}`)
          if (res.ok) {
            const json = await res.json()
            return json.data || null
          }
        } catch (e) {
          console.warn('API fallback also failed:', e.message)
        }
        return null
      }
      return data
    } catch (err) {
      console.error('fetchMember error:', err)
      return null
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const memberData = await fetchMember(session.user.id)
        setMember(memberData)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const memberData = await fetchMember(session.user.id)
          setMember(memberData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setMember(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchMember])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMember(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, member, loading, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
