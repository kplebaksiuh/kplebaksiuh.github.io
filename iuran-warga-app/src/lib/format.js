export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const BULAN_IURAN = [
  { idx: 0, nama: 'Oktober',   bulan: 10 },
  { idx: 1, nama: 'November',  bulan: 11 },
  { idx: 2, nama: 'Desember',  bulan: 12 },
  { idx: 3, nama: 'Januari',   bulan: 1  },
  { idx: 4, nama: 'Februari',  bulan: 2  },
  { idx: 5, nama: 'Maret',     bulan: 3  },
  { idx: 6, nama: 'April',     bulan: 4  },
  { idx: 7, nama: 'Mei',       bulan: 5  },
  { idx: 8, nama: 'Juni',      bulan: 6  },
  { idx: 9, nama: 'Juli',      bulan: 7  },
  { idx: 10, nama: 'Agustus',  bulan: 8  },
  { idx: 11, nama: 'September',bulan: 9  },
]

export const ROLE_LABEL = {
  ketua_rt: 'Ketua RT',
  bendahara: 'Bendahara',
  penagih: 'Penagih',
  anggota: 'Anggota',
}

export const ROLE_COLOR = {
  ketua_rt: 'bg-purple-100 text-purple-700',
  bendahara: 'bg-blue-100 text-blue-700',
  penagih: 'bg-amber-100 text-amber-700',
  anggota: 'bg-gray-100 text-gray-600',
}
