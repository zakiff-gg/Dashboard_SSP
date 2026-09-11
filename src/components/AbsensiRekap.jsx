import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useToast } from "./Toast.jsx";
import { SkeletonTable } from "./Skeleton.jsx";
import { enumerateDates, toShortLabel, firstDayOfThisMonthIso, todayIso } from "../utils/dateRange.js";
import { exportRekapExcel, exportRekapPdf } from "../utils/exportRekap.js";

export default function AbsensiRekap() {
  const toast = useToast();
  const [tanggalMulai, setTanggalMulai] = useState(firstDayOfThisMonthIso());
  const [tanggalSelesai, setTanggalSelesai] = useState(todayIso());
  const [karyawan, setKaryawan] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [karyawanRes, historyRes] = await Promise.all([
        api.getKaryawan(),
        api.searchHistory("", tanggalMulai, tanggalSelesai),
      ]);
      if (karyawanRes.status === "SUKSES") setKaryawan(karyawanRes.karyawan);
      if (historyRes.status === "SUKSES") {
        setRecords(historyRes.data);
      } else {
        setError(historyRes.pesan || "Gagal memuat data absensi.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    load();
  }

  const dates = useMemo(() => enumerateDates(tanggalMulai, tanggalSelesai), [tanggalMulai, tanggalSelesai]);

  const rows = useMemo(() => {
    // uid -> tanggal -> { berangkat, pulangSetengahHari, pulang, overtime }
    const perUid = {};
    for (const rec of records) {
      if (!perUid[rec.uid]) perUid[rec.uid] = {};
      if (!perUid[rec.uid][rec.tanggal]) {
        perUid[rec.uid][rec.tanggal] = { berangkat: false, pulang: false, setengahHari: false, overtime: 0 };
      }
      const cell = perUid[rec.uid][rec.tanggal];
      if (rec.jenis === "Berangkat") cell.berangkat = true;
      if (rec.jenis === "Pulang") {
        cell.pulang = true;
        if (rec.keterangan === "Pulang - Setengah Hari") cell.setengahHari = true;
      }
      cell.overtime += Number(rec.jamLembur) || 0;
    }

    return karyawan.map((k, idx) => {
      const perTanggal = perUid[k.uid] || {};
      const cells = {};
      let totalHari = 0;
      let totalLembur = 0;

      for (const d of dates) {
        const c = perTanggal[d];
        if (!c || (!c.berangkat && !c.pulang)) {
          cells[d] = { type: "empty", overtime: 0 };
          continue;
        }
        const isHalf = c.setengahHari || (c.berangkat && !c.pulang) || (!c.berangkat && c.pulang);
        cells[d] = { type: isHalf ? "half" : "full", overtime: c.overtime };
        totalHari += (c.berangkat ? 0.5 : 0) + (c.pulang ? 0.5 : 0);
        totalLembur += c.overtime;
      }

      return {
        no: idx + 1,
        uid: k.uid,
        nama: k.nama,
        jabatan: k.posisi,
        cells,
        totalHari,
        totalLembur,
      };
    });
  }, [karyawan, records, dates]);

  function handleExportExcel() {
    if (dates.length === 0) {
      toast.error("Rentang tanggal tidak valid.");
      return;
    }
    exportRekapExcel({ dates, rows, tanggalMulai, tanggalSelesai });
    toast.success("File Excel sedang diunduh.");
  }

  function handleExportPdf() {
    if (dates.length === 0) {
      toast.error("Rentang tanggal tidak valid.");
      return;
    }
    exportRekapPdf({ dates, rows, tanggalMulai, tanggalSelesai });
    toast.success("File PDF sedang diunduh.");
  }

  return (
    <div>
      <form className="toolbar filter-form" onSubmit={handleFilter}>
        <span className="muted">Dari</span>
        <input type="date" className="text-input" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
        <span className="muted">s/d</span>
        <input type="date" className="text-input" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
        <button type="submit" className="action-btn" disabled={loading}>
          {loading ? "Memuat..." : "Terapkan"}
        </button>
        <div className="spacer" />
        <button type="button" className="export-btn export-excel" onClick={handleExportExcel} disabled={loading}>
          Export Excel
        </button>
        <button type="button" className="export-btn export-pdf" onClick={handleExportPdf} disabled={loading}>
          Export PDF
        </button>
      </form>

      {error && <div className="error-text">{error}</div>}

      {loading ? (
        <SkeletonTable cols={8} />
      ) : dates.length === 0 ? (
        <div className="muted center" style={{ padding: 24 }}>
          Rentang tanggal tidak valid.
        </div>
      ) : (
        <div className="matrix-scroll">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="sticky-col col-no">No</th>
                <th className="sticky-col col-nama">Nama</th>
                <th className="sticky-col col-jabatan">Jabatan</th>
                {dates.map((d) => (
                  <th key={d} className="date-col">
                    {toShortLabel(d)}
                  </th>
                ))}
                <th>Total Hari</th>
                <th>Jam Lembur</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.uid} className="row-in" style={{ animationDelay: `${idx * 20}ms` }}>
                  <td className="sticky-col col-no">{r.no}</td>
                  <td className="sticky-col col-nama">{r.nama}</td>
                  <td className="sticky-col col-jabatan">{r.jabatan}</td>
                  {dates.map((d) => {
                    const c = r.cells[d];
                    return (
                      <td key={d} className="date-col matrix-cell">
                        {c.type === "full" && (
                          <span className="check-mark">
                            ✓{c.overtime > 0 && <sup className="check-overtime">{c.overtime}</sup>}
                          </span>
                        )}
                        {c.type === "half" && (
                          <span className="half-mark">
                            ½{c.overtime > 0 && <sup className="check-overtime">{c.overtime}</sup>}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="strong-cell">{r.totalHari}</td>
                  <td>{r.totalLembur || ""}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={dates.length + 5} className="muted center">
                    Belum ada data karyawan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
