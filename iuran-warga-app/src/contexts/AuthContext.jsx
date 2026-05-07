import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logAktivitas } from '../lib/logger'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*, pengguna:pengguna_id(id, nama, nominal_iuran)')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) logAktivitas('Masuk ke aplikasi')
    return error
  }

  async function signOut() {
    await logAktivitas('Keluar dari aplikasi')
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'ketua_rt' || profile?.role === 'bendahara'
  const isStaff = isAdmin || profile?.role === 'penagih'

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
