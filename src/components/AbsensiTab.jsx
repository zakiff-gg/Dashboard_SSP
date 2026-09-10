import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "./Toast.jsx";

export default function AbsensiTab({ password }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nama, setNama] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [jamLemburValue, setJamLemburValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.searchHistory(nama, tanggalMulai, tanggalSelesai);
      if (res.status === "SUKSES") {
        setRows(res.data);
      } else {
        setError(res.pesan || "Gagal memuat data absensi.");
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

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  function startEdit(row) {
    setEditingRow(row.rowIndex);
    setJamLemburValue(String(row.jamLembur || 0));
  }

  async function saveJamLembur(rowIndex) {
    setSaving(true);
    try {
      const res = await api.editJamLembur(password, rowIndex, jamLemburValue);
      if (res.status === "SUKSES") {
        toast.success("Jam lembur berhasil diperbarui.");
        setEditingRow(null);
        await load();
      } else {
        toast.error(res.pesan || "Gagal menyimpan jam lembur.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form className="toolbar filter-form" onSubmit={handleSearch}>
        <input
          className="text-input"
          placeholder="Cari nama..."
          value={nama}
          onChange={(e) => setNama(e.target.value)}
        />
        <input type="date" className="text-input" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
        <span className="muted">s/d</span>
        <input type="date" className="text-input" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
        <button type="submit" className="action-btn" disabled={loading}>
          {loading ? "Mencari..." : "Cari"}
        </button>
      </form>

      {error && <div className="error-text">{error}</div>}

      {loading ? (
        <SkeletonTable cols={7} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama</th>
              <th>Jenis</th>
              <th>Jam</th>
              <th>Keterangan</th>
              <th>Proyek</th>
              <th>Jam Lembur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) =>
              editingRow === r.rowIndex ? (
                <tr key={r.rowIndex} className="editing-row row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{r.tanggal}</td>
                  <td>{r.nama}</td>
                  <td>{r.jenis}</td>
                  <td>{r.jam}</td>
                  <td>{r.keterangan}</td>
                  <td>{r.proyek}</td>
                  <td>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={jamLemburValue}
                      onChange={(e) => setJamLemburValue(e.target.value)}
                      autoFocus
                    />
                  </td>
                  <td className="row-actions">
                    <button className="action-btn" disabled={saving} onClick={() => saveJamLembur(r.rowIndex)}>
                      {saving ? "..." : "Simpan"}
                    </button>
                    <button className="secondary-btn" disabled={saving} onClick={() => setEditingRow(null)}>
                      Batal
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={r.rowIndex} className="row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{r.tanggal}</td>
                  <td>{r.nama}</td>
                  <td>
                    <span className={`badge ${r.jenis === "Berangkat" ? "badge-green" : "badge-blue"}`}>{r.jenis}</span>
                  </td>
                  <td>{r.jam}</td>
                  <td className={r.keterangan && r.keterangan.indexOf("Telat") !== -1 ? "overdue-cell" : ""}>
                    {r.keterangan}
                  </td>
                  <td>{r.proyek}</td>
                  <td>{r.jamLembur || 0}</td>
                  <td>
                    <button className="action-btn" onClick={() => startEdit(r)}>
                      Edit Lembur
                    </button>
                  </td>
                </tr>
              )
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="muted center">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SkeletonTable({ cols }) {
  return (
    <div className="skeleton-table">
      {[0, 1, 2, 3, 4].map((row) => (
        <div className="skeleton-row" key={row} style={{ animationDelay: `${row * 90}ms` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div className="skeleton-cell shimmer" key={c} />
          ))}
        </div>
      ))}
    </div>
  );
}

export { SkeletonTable };
