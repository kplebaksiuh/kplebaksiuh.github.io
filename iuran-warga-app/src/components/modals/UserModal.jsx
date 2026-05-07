import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ROLE_LABEL } from '../../lib/format'
import { logAktivitas } from '../../lib/logger'

const ROLES = ['ketua_rt', 'bendahara', 'penagih', 'anggota']

export default function UserModal({ user, pengguna, onClose, onSaved }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'anggota',
    pengguna_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        nama: user.nama,
        email: user.email || '',
        password: '',
        role: user.role,
        pengguna_id: user.pengguna_id || '',
      })
    }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isEdit) {
      const { error: err } = await supabase.from('profiles').update({
        nama: form.nama.trim(),
        role: form.role,
        pengguna_id: form.pengguna_id || null,
      }).eq('id', user.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
        user_metadata: {
          nama: form.nama.trim(),
          role: form.role,
          pengguna_id: form.pengguna_id || null,
        },
      })
      if (err) { setError(err.message); setLoading(false); return }
    }

    logAktivitas('Mengubah profil akun user', `${form.nama.trim()} (role: ${ROLE_LABEL[form.role]})`)
    onSaved()
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Edit User' : 'Tambah User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap</label>
            <input type="text" value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nama Lengkap" required />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@contoh.com" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Min. 6 karakter" minLength={6} required />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r} type="button"
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.role === r
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-600 hover:border-green-400'
                  }`}>
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {form.role === 'anggota' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hubungkan ke Anggota Warga
              </label>
              <select value={form.pengguna_id}
                onChange={e => setForm(f => ({ ...f, pengguna_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">-- Tidak dihubungkan --</option>
                {pengguna.map(p => (
                  <option key={p.id} value={p.id}>{p.nomor_urut}. {p.nama}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Anggota akan melihat status bayar sesuai data yang dipilih</p>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
