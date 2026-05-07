import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/format'
import { logAktivitas } from '../../lib/logger'

const TARIF_PRESET = [5000, 10000, 25000]

export default function AnggotaModal({ anggota, onClose, onSaved }) {
  const isEdit = !!anggota
  const [form, setForm] = useState({
    nomor_urut: '',
    nama: '',
    nominal_iuran: 5000,
    is_active: true,
  })
  const [customNominal, setCustomNominal] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (anggota) {
      const isPreset = TARIF_PRESET.includes(anggota.nominal_iuran)
      setForm({
        nomor_urut: anggota.nomor_urut,
        nama: anggota.nama,
        nominal_iuran: isPreset ? anggota.nominal_iuran : TARIF_PRESET[0],
        is_active: anggota.is_active,
      })
      if (!isPreset) {
        setUseCustom(true)
        setCustomNominal(String(anggota.nominal_iuran))
      }
    }
  }, [anggota])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const nominal = useCustom
      ? parseInt(customNominal.replace(/\D/g, ''), 10) || 0
      : form.nominal_iuran

    if (nominal <= 0) {
      setError('Nominal iuran harus lebih dari 0.')
      setLoading(false)
      return
    }

    const payload = {
      nomor_urut: Number(form.nomor_urut),
      nama: form.nama.trim().toUpperCase(),
      nominal_iuran: nominal,
      is_active: form.is_active,
    }

    const { error: err } = isEdit
      ? await supabase.from('pengguna').update(payload).eq('id', anggota.id)
      : await supabase.from('pengguna').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      const aksi = isEdit ? 'Mengubah data anggota warga' : 'Menambah anggota warga'
      logAktivitas(aksi, `${payload.nama} (iuran ${formatRupiah(payload.nominal_iuran)}/bln)`)
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Edit Anggota' : 'Tambah Anggota'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">No. Urut</label>
              <input
                type="number"
                value={form.nomor_urut}
                onChange={e => setForm(f => ({ ...f, nomor_urut: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama</label>
              <input
                type="text"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="NAMA ANGGOTA"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Iuran/Bulan</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {TARIF_PRESET.map(tarif => (
                <button
                  key={tarif}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, nominal_iuran: tarif })); setUseCustom(false) }}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    !useCustom && form.nominal_iuran === tarif
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-600 hover:border-green-400'
                  }`}
                >
                  {formatRupiah(tarif)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                  useCustom
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-300 text-gray-600 hover:border-green-400'
                }`}
              >
                Custom
              </button>
            </div>
            {useCustom && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rp</span>
                <input
                  type="number"
                  value={customNominal}
                  onChange={e => setCustomNominal(e.target.value)}
                  className="flex-1 border border-green-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan nominal"
                  min="1"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Anggota aktif</label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

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
