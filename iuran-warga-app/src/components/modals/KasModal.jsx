import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logAktivitas } from '../../lib/logger'
import { formatRupiah } from '../../lib/format'

export default function KasModal({ type, item, onClose, onSaved }) {
  const table = type === 'pemasukan' ? 'pemasukan' : 'pengeluaran'
  const isEdit = !!item
  const [form, setForm] = useState({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', nominal: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) setForm({ tanggal: item.tanggal, keterangan: item.keterangan, nominal: item.nominal })
  }, [item])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = { tanggal: form.tanggal, keterangan: form.keterangan.trim(), nominal: Number(form.nominal) }
    const { error: err } = isEdit
      ? await supabase.from(table).update(payload).eq('id', item.id)
      : await supabase.from(table).insert(payload)
    if (err) setError(err.message)
    else {
      const jenis = type === 'pemasukan' ? 'pemasukan' : 'pengeluaran'
      const aksi = isEdit ? 'Mengubah' : 'Mencatat'
      logAktivitas(`${aksi} ${jenis}`, `${payload.keterangan} (${formatRupiah(payload.nominal)})`)
      onSaved(); onClose()
    }
    setLoading(false)
  }

  const title = type === 'pemasukan'
    ? (isEdit ? 'Edit Pemasukan' : 'Tambah Pemasukan')
    : (isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
            <input type="date" value={form.tanggal}
              onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Keterangan</label>
            <input type="text" value={form.keterangan}
              onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Keterangan transaksi..." required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nominal (Rp)</label>
            <input type="number" value={form.nominal}
              onChange={e => setForm(f => ({ ...f, nominal: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0" min="1" required />
          </div>
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
