import { supabase } from './supabase'

let cachedIp = null

async function getIp() {
  if (cachedIp) return cachedIp
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const json = await res.json()
    cachedIp = json.ip
  } catch {
    cachedIp = '-'
  }
  return cachedIp
}

getIp()

export async function logAktivitas(aktivitas, detail = null) {
  try {
    const [{ data: { user } }, ip] = await Promise.all([
      supabase.auth.getUser(),
      getIp(),
    ])
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('nama, role')
      .eq('id', user.id)
      .single()

    await supabase.from('log_aktivitas').insert({
      user_id: user.id,
      nama_user: p?.nama || user.email || '-',
      role: p?.role || '-',
      aktivitas,
      detail: detail || null,
      ip_address: ip,
    })
  } catch {
    // Silent — logging tidak boleh menghentikan alur utama
  }
}
