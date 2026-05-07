import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ROLE_LABEL, ROLE_COLOR } from '../../lib/format'
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

function formatWaktu(ts) {
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function LogAktivitasTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('log_aktivitas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000)
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return (
      l.nama_user?.toLowerCase().includes(q) ||
      l.aktivitas?.toLowerCase().includes(q) ||
      l.detail?.toLowerCase().includes(q) ||
      l.ip_address?.toLowerCase().includes(q) ||
      ROLE_LABEL[l.role]?.toLowerCase().includes(q)
    )
  })

  const showAll = perPage === 'all'
  const itemsPerPage = showAll ? filtered.length || 1 : perPage
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const safePage = Math.min(page, totalPages)
  const startIdx = showAll ? 0 : (safePage - 1) * itemsPerPage
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage)

  function handleSearch(val) { setSearch(val); setPage(1) }
  function handlePerPage(val) { setPerPage(val === 'all' ? 'all' : Number(val)); setPage(1) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Log Aktivitas</h2>
          <p className="text-xs text-gray-500 mt-0.5">{logs.length} entri tercatat</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 border border-gray-300 hover:border-green-400 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Cari nama, aktivitas, detail, atau IP..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Waktu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aktivitas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    Memuat log...
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                  {search ? 'Tidak ada hasil pencarian' : 'Belum ada log aktivitas'}
                </td></tr>
              ) : paginated.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap align-top">
                    {formatWaktu(l.created_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{l.nama_user}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[l.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[l.role] || l.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm text-gray-800">{l.aktivitas}</p>
                    {l.detail && (
                      <p className="text-xs text-gray-400 mt-0.5">{l.detail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 align-top whitespace-nowrap">
                    {l.ip_address || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tampilkan:</span>
              <select
                value={perPage}
                onChange={e => handlePerPage(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Semua</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                {showAll
                  ? `Semua ${filtered.length} entri`
                  : `${filtered.length === 0 ? 0 : startIdx + 1}–${Math.min(startIdx + itemsPerPage, filtered.length)} dari ${filtered.length}`}
              </p>
              {!showAll && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={safePage === 1}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-xs text-gray-600 font-medium px-1">{safePage} / {totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
