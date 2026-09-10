import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "./Toast.jsx";
import { SkeletonTable } from "./AbsensiTab.jsx";

const formatRupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function OperasionalTab({ password }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tipe: "", kategori: "", jumlah: "", keterangan: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getOperasionalAll(password);
      if (res.status === "SUKSES") {
        setRows(res.operasional);
      } else {
        setError(res.pesan || "Gagal memuat data operasional.");
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

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      tipe: row.tipe,
      kategori: row.kategori || "",
      jumlah: String(row.jumlah),
      keterangan: row.keterangan || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      const res = await api.editOperasionalAdmin(password, { id, ...form });
      if (res.status === "SUKSES") {
        toast.success("Laporan berhasil diperbarui.");
        setEditingId(null);
        await load();
      } else {
        toast.error(res.pesan || "Gagal menyimpan perubahan.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div />
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {loading ? (
        <SkeletonTable cols={9} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Diinput Oleh</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Jumlah</th>
              <th>Keterangan</th>
              <th>Saldo</th>
              <th>Bukti</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) =>
              editingId === r.id ? (
                <tr key={r.id} className="editing-row row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{r.tanggal}</td>
                  <td>{r.diinputOleh}</td>
                  <td>
                    <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
                      <option value="Masuk">Masuk</option>
                      <option value="Keluar">Keluar</option>
                    </select>
                  </td>
                  <td>
                    <input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={form.jumlah}
                      onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                    />
                  </td>
                  <td>
                    <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
                  </td>
                  <td>{formatRupiah(r.saldo)}</td>
                  <td>{r.urlBukti && <a href={r.urlBukti} target="_blank" rel="noreferrer">Lihat</a>}</td>
                  <td className="row-actions">
                    <button className="action-btn" disabled={saving} onClick={() => saveEdit(r.id)}>
                      {saving ? "..." : "Simpan"}
                    </button>
                    <button className="secondary-btn" disabled={saving} onClick={cancelEdit}>
                      Batal
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={r.id} className="row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{r.tanggal}</td>
                  <td>{r.diinputOleh}</td>
                  <td>
                    <span className={`badge ${r.tipe === "Masuk" ? "badge-green" : "badge-red"}`}>{r.tipe}</span>
                  </td>
                  <td>{r.kategori}</td>
                  <td>{formatRupiah(r.jumlah)}</td>
                  <td className="wrap-cell">{r.keterangan}</td>
                  <td>{formatRupiah(r.saldo)}</td>
                  <td>{r.urlBukti && <a href={r.urlBukti} target="_blank" rel="noreferrer">Lihat</a>}</td>
                  <td>
                    <button className="action-btn" onClick={() => startEdit(r)}>
                      Edit
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
        </table>
      )}
    </div>
  );
}
