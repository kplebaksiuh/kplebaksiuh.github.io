import { useState } from 'react'
import { X, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logAktivitas } from '../../lib/logger'

export default function GantiPasswordModal({ targetUser = null, onClose }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isAdminReset = targetUser !== null
  const title = isAdminReset ? `Reset Password — ${targetUser.nama}` : 'Ganti Password'

  async function handleSimpan() {
    setError('')
    if (newPassword.length < 6) return setError('Password minimal 6 karakter.')
    if (newPassword !== confirmPassword) return setError('Konfirmasi password tidak cocok.')

    setLoading(true)
    try {
      if (isAdminReset) {
        const { error: err } = await supabase.rpc('admin_reset_password', {
          target_user_id: targetUser.id,
          new_password: newPassword,
        })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.updateUser({ password: newPassword })
        if (err) throw err
      }
      logAktivitas(
        isAdminReset ? 'Mereset password akun user' : 'Mengubah password akun',
        isAdminReset ? targetUser.nama : null
      )
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan password.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Password Berhasil Diubah</h2>
          <p className="text-sm text-gray-500 mb-6">
            {isAdminReset
              ? `Password ${targetUser.nama} telah direset.`
              : 'Password Anda telah berhasil diperbarui.'}
          </p>
          <button onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
            Tutup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-green-600" />
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isAdminReset && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
              Anda akan mereset password untuk akun <strong>{targetUser.nama}</strong>.
              Pastikan user mengetahui password barunya.
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyDown={e => e.key === 'Enter' && handleSimpan()}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button onClick={handleSimpan} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
