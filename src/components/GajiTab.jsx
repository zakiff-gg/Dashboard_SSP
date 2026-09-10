import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useToast } from "./Toast.jsx";
import { SkeletonTable } from "./Skeleton.jsx";

const formatRupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

export default function GajiTab({ password }) {
  const toast = useToast();
  const [karyawan, setKaryawan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editingUid, setEditingUid] = useState(null);
  const [form, setForm] = useState({ upahHarian: "", upahLembur: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getKaryawan();
      if (res.status === "SUKSES") {
        setKaryawan(res.karyawan);
      } else {
        setError(res.pesan || "Gagal memuat data karyawan.");
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

  function startEdit(k) {
    setEditingUid(k.uid);
    setForm({ upahHarian: String(k.upahHarian), upahLembur: String(k.upahLembur) });
  }

  async function saveEdit(uid) {
    setSaving(true);
    try {
      const res = await api.editUpahKaryawan(password, uid, form.upahHarian, form.upahLembur);
      if (res.status === "SUKSES") {
        toast.success("Upah karyawan berhasil diperbarui.");
        setEditingUid(null);
        await load();
      } else {
        toast.error(res.pesan || "Gagal menyimpan.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return karyawan
      .filter((k) => !q || k.nama.toLowerCase().includes(q))
      .map((k) => {
        const gajiPokok = k.jumlahHariMasuk * k.upahHarian;
        const lembur = k.jumlahJamLembur * k.upahLembur;
        const totalKotor = gajiPokok + lembur;
        const estimasiDiterima = totalKotor - k.bonDiterima;
        return { ...k, gajiPokok, lembur, totalKotor, estimasiDiterima };
      });
  }, [karyawan, query]);

  const totalEstimasi = rows.reduce((sum, r) => sum + r.estimasiDiterima, 0);

  return (
    <div>
      <div className="toolbar">
        <input
          className="text-input"
          placeholder="Cari nama karyawan..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <p className="muted gaji-note">
        Estimasi diterima = (Hari Masuk × Upah Harian) + (Jam Lembur × Upah Lembur) − Bon Diterima. Belum termasuk
        potongan lain (jika ada) — murni estimasi dari data yang tercatat sistem.
      </p>

      {loading ? (
        <SkeletonTable cols={8} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Posisi</th>
              <th>Hari Masuk</th>
              <th>Upah Harian</th>
              <th>Jam Lembur</th>
              <th>Upah Lembur</th>
              <th>Bon Diterima</th>
              <th>Estimasi Diterima</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k, idx) =>
              editingUid === k.uid ? (
                <tr key={k.uid} className="editing-row row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{k.nama}</td>
                  <td>{k.posisi}</td>
                  <td>{k.jumlahHariMasuk}</td>
                  <td>
                    <input
                      type="number"
                      value={form.upahHarian}
                      onChange={(e) => setForm({ ...form, upahHarian: e.target.value })}
                      autoFocus
                    />
                  </td>
                  <td>{k.jumlahJamLembur}</td>
                  <td>
                    <input
                      type="number"
                      value={form.upahLembur}
                      onChange={(e) => setForm({ ...form, upahLembur: e.target.value })}
                    />
                  </td>
                  <td>{formatRupiah(k.bonDiterima)}</td>
                  <td className="strong-cell">{formatRupiah(k.estimasiDiterima)}</td>
                  <td className="row-actions">
                    <button className="action-btn" disabled={saving} onClick={() => saveEdit(k.uid)}>
                      {saving ? "..." : "Simpan"}
                    </button>
                    <button className="secondary-btn" disabled={saving} onClick={() => setEditingUid(null)}>
                      Batal
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={k.uid} className="row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{k.nama}</td>
                  <td>{k.posisi}</td>
                  <td>{k.jumlahHariMasuk}</td>
                  <td>{formatRupiah(k.upahHarian)}</td>
                  <td>{k.jumlahJamLembur}</td>
                  <td>{formatRupiah(k.upahLembur)}</td>
                  <td>{formatRupiah(k.bonDiterima)}</td>
                  <td className="strong-cell">{formatRupiah(k.estimasiDiterima)}</td>
                  <td>
                    <button className="action-btn" onClick={() => startEdit(k)}>
                      Edit Upah
                    </button>
                  </td>
                </tr>
              )
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="muted center">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="footer-row">
                <td colSpan={7}>Total Estimasi (hasil pencarian saat ini)</td>
                <td className="strong-cell">{formatRupiah(totalEstimasi)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  );
}
