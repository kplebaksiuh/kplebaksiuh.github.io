import { useState } from 'react'
import { Users, Home, TrendingUp, TrendingDown, BarChart2, UserCog, Activity } from 'lucide-react'
import Navbar from '../components/Navbar'
import AnggotaTab from '../components/tabs/AnggotaTab'
import IuranTab from '../components/tabs/IuranTab'
import PemasukanTab from '../components/tabs/PemasukanTab'
import PengeluaranTab from '../components/tabs/PengeluaranTab'
import LaporanTab from '../components/tabs/LaporanTab'
import UserManagementTab from '../components/tabs/UserManagementTab'
import LogAktivitasTab from '../components/tabs/LogAktivitasTab'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { isAdmin, isStaff } = useAuth()
  const [activeTab, setActiveTab] = useState('iuran')

  const tabs = [
    { id: 'iuran', label: 'Iuran', icon: Home, show: isStaff },
    { id: 'anggota', label: 'Anggota', icon: Users, show: isAdmin },
    { id: 'pemasukan', label: 'Pemasukan', icon: TrendingUp, show: isAdmin },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: TrendingDown, show: isAdmin },
    { id: 'laporan', label: 'Laporan', icon: BarChart2, show: isAdmin },
    { id: 'users', label: 'Kelola User', icon: UserCog, show: isAdmin },
    { id: 'log', label: 'Log Aktivitas', icon: Activity, show: isAdmin },
  ].filter(t => t.show)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-5 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-none flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'iuran' && <IuranTab />}
        {activeTab === 'anggota' && <AnggotaTab />}
        {activeTab === 'pemasukan' && <PemasukanTab />}
        {activeTab === 'pengeluaran' && <PengeluaranTab />}
        {activeTab === 'laporan' && <LaporanTab />}
        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'log' && <LogAktivitasTab />}
      </main>
    </div>
  )
}
