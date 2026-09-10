// Format Date -> "yyyy-MM-dd" (dipakai untuk kirim ke backend & input type=date)
export function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Format "yyyy-MM-dd" -> "dd/MM/yy" (dipakai untuk label kolom tanggal, sesuai contoh)
export function toShortLabel(isoStr) {
  const [y, m, d] = isoStr.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

// Menghasilkan array tanggal ISO dari tanggalMulai s/d tanggalSelesai (inklusif).
export function enumerateDates(tanggalMulaiIso, tanggalSelesaiIso) {
  const dates = [];
  const start = new Date(tanggalMulaiIso + "T00:00:00");
  const end = new Date(tanggalSelesaiIso + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return dates;

  const cursor = new Date(start);
  // Batas wajar supaya tidak infinite-loop/matrix raksasa kalau user salah pilih tanggal.
  let guard = 0;
  while (cursor <= end && guard < 366) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return dates;
}

export function firstDayOfThisMonthIso() {
  const now = new Date();
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function todayIso() {
  return toIsoDate(new Date());
}
