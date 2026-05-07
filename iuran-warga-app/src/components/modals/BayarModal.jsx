import { useState, useEffect } from 'react'
import { X, CheckCircle2, Pencil, Trash2, Check, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BULAN_IURAN, formatRupiah } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { logAktivitas } from '../../lib/logger'

export default function BayarModal({ pengguna, tahunIuran, onClose, onSaved }) {
  const { isAdmin } = useAuth()
  const [lunasMap, setLunasMap] = useState({})
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editBulan, setEditBulan] = useState(null)
  const [editNominal, setEditNominal] = useState('')

  async function fetchPembayaran() {
    const { data } = await supabase
      .from('pembayaran')
      .select('id, bulan, nominal')
      .eq('pengguna_id', pengguna.id)
      .eq('tahun_iuran_id', tahunIuran.id)
    const map = {}
    ;(data || []).forEach(d => { map[d.bulan] = { id: d.id, nominal: d.nominal } })
    setLunasMap(map)
    setLoading(false)
  }

  useEffect(() => { fetchPembayaran() }, [pengguna.id, tahunIuran.id])

  function toggleBulan(bulan) {
    if (lunasMap[bulan]) return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(bulan) ? next.delete(bulan) : next.add(bulan)
      return next
    })
  }

  async function handleSimpan() {
    if (selected.size === 0) return
    setSaving(true)
    setError('')
    const rows = [...selected].map(bulan => ({
      pengguna_id: pengguna.id,
      tahun_iuran_id: tahunIuran.id,
      bulan,
      nominal: pengguna.nominal_iuran,
      tanggal_bayar: new Date().toISOString().split('T')[0],
    }))
    const { error: err } = await supabase.from('pembayaran').insert(rows)
    if (err) setError(err.message)
    else {
      const bulanNames = [...selected].map(b => BULAN_IURAN.find(x => x.bulan === b)?.nama).join(', ')
      logAktivitas('Mencatat pembayaran iuran warga', `${bulanNames} untuk ${pengguna.nama} (${formatRupiah(totalBayar)})`)
      onSaved(); onClose()
    }
    setSaving(false)
  }

  function startEdit(bulan) {
    setEditBulan(bulan)
    setEditNominal(String(lunasMap[bulan].nominal))
  }

  async function handleEditSimpan(bulan) {
    const nominal = parseInt(editNominal.replace(/\D/g, ''), 10)
    if (!nominal || nominal <= 0) return
    const { error: err } = await supabase
      .from('pembayaran')
      .update({ nominal })
      .eq('id', lunasMap[bulan].id)
    if (!err) {
      const namaBulan = BULAN_IURAN.find(x => x.bulan === bulan)?.nama
      logAktivitas('Mengubah nominal pembayaran', `${namaBulan} untuk ${pengguna.nama}: Rp ${lunasMap[bulan].nominal} → Rp ${nominal}`)
      await fetchPembayaran()
      setEditBulan(null)
      onSaved()
    }
  }

  async function handleHapus(bulan, namaBulan) {
    if (!confirm(`Hapus pembayaran ${namaBulan} untuk ${pengguna.nama}?`)) return
    const { error: err } = await supabase
      .from('pembayaran')
      .delete()
      .eq('id', lunasMap[bulan].id)
    if (!err) {
      logAktivitas('Menghapus pembayaran', `${namaBulan} untuk ${pengguna.nama}`)
      await fetchPembayaran()
      onSaved()
    }
  }

  const getBulanStatus = (bulan) => {
    if (lunasMap[bulan]) return 'lunas'
    if (selected.has(bulan)) return 'selected'
    return 'belum'
  }

  const totalBayar = selected.size * pengguna.nominal_iuran

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{pengguna.nama}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Iuran {tahunIuran.label} &bull; Tarif {formatRupiah(pengguna.nominal_iuran)}/bln
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Memuat data...</p>
          ) : (
            <>
              <p className="text-xs font-medium text-gray-500 mb-3">
                Pilih bulan yang ingin dibayar
                {isAdmin && <span className="text-amber-600 ml-1">&bull; Admin: klik ✏️ untuk edit nominal, 🗑️ untuk hapus</span>}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {BULAN_IURAN.map(({ bulan, nama }) => {
                  const status = getBulanStatus(bulan)

                  if (status === 'lunas') {
                    if (editBulan === bulan) {
                      return (
                        <div key={bulan} className="rounded-xl border-2 border-amber-400 bg-amber-50 p-2">
                          <p className="text-xs font-semibold text-amber-700 mb-1.5">{nama}</p>
                          <input
                            type="number"
                            value={editNominal}
                            onChange={e => setEditNominal(e.target.value)}
                            className="w-full text-xs border border-amber-300 rounded-lg px-2 py-1 mb-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            placeholder="Nominal"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditSimpan(bulan)
                              if (e.key === 'Escape') setEditBulan(null)
                            }}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditSimpan(bulan)}
                              className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-1 text-xs font-medium"
                            >
                              <Check size={11} /> Simpan
                            </button>
                            <button
                              onClick={() => setEditBulan(null)}
                              className="flex items-center justify-center px-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg py-1"
                            >
                              <XCircle size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={bulan} className="relative rounded-xl border border-green-200 bg-green-50 p-2.5">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs font-semibold text-green-700">{nama}</p>
                          <CheckCircle2 size={12} className="text-green-500 flex-none mt-0.5" />
                        </div>
                        <p className="text-xs text-green-600 font-medium">{formatRupiah(lunasMap[bulan].nominal)}</p>
                        {isAdmin && (
                          <div className="flex gap-1 mt-1.5">
                            <button
                              onClick={() => startEdit(bulan)}
                              className="flex-1 flex items-center justify-center gap-0.5 bg-white border border-amber-300 text-amber-600 hover:bg-amber-50 rounded-lg py-1 text-xs"
                              title="Edit nominal"
                            >
                              <Pencil size={10} /> Edit
                            </button>
                            <button
                              onClick={() => handleHapus(bulan, nama)}
                              className="flex items-center justify-center px-2 bg-white border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg py-1"
                              title="Hapus pembayaran"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <button
                      key={bulan}
                      type="button"
                      onClick={() => toggleBulan(bulan)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                        status === 'selected'
                          ? 'bg-green-600 border-green-600 text-white shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      {nama}
                    </button>
                  )
                })}
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Bulan dipilih</p>
                  <p className="text-sm font-medium text-gray-700">{selected.size} bulan</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total bayar</p>
                  <p className="text-lg font-bold text-green-600">{formatRupiah(totalBayar)}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
                  Tutup
                </button>
                <button
                  onClick={handleSimpan}
                  disabled={selected.size === 0 || saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
