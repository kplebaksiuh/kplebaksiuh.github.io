"""
Skrip untuk mengekspor daftar akun anggota ke file Excel/CSV.
Jalankan: python export_akun_anggota.py
"""

import re
import csv
from supabase import create_client

# ===================================================
SUPABASE_URL = "https://GANTI_DENGAN_URL_SUPABASE_ANDA.supabase.co"
SUPABASE_SERVICE_KEY = "GANTI_DENGAN_SERVICE_ROLE_KEY_ANDA"
PASSWORD_DEFAULT = "iuranwarga"
EMAIL_DOMAIN = "iuranwarga.com"
OUTPUT_CSV = r"c:\iuran_warga\daftar_akun_anggota.csv"
# ===================================================


def nama_ke_email(nama):
    nama = nama.strip().lower()
    nama = nama.replace("'", "")
    if '/' in nama:
        parts = nama.split('/')
        parts = [''.join(p.split()) for p in parts]
        local = '.'.join(p for p in parts if p)
    else:
        local = re.sub(r'[^a-z0-9.]', '.', nama)
        local = re.sub(r'\.{2,}', '.', local)
    local = local.strip('.')
    return f"{local}@{EMAIL_DOMAIN}"


sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
pengguna_list = sb.table("pengguna").select("id, nomor_urut, nama, nominal_iuran").order("nomor_urut").execute().data

rows = []
for p in pengguna_list:
    rows.append({
        "No": p["nomor_urut"],
        "Nama": p["nama"],
        "Email": nama_ke_email(p["nama"]),
        "Password": PASSWORD_DEFAULT,
        "Iuran/Bulan": p["nominal_iuran"],
    })

with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=["No", "Nama", "Email", "Password", "Iuran/Bulan"])
    writer.writeheader()
    writer.writerows(rows)

print(f"✓ Diekspor {len(rows)} akun ke {OUTPUT_CSV}")
