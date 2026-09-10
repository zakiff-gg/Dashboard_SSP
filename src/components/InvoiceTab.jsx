import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "./Toast.jsx";
import { usePrompt } from "./PromptDialog.jsx";
import { SkeletonTable } from "./Skeleton.jsx";

const formatRupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

function hariSelisih(tanggalStr) {
  if (!tanggalStr) return null;
  const target = new Date(tanggalStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function statusBadgeClass(status) {
  if (status === "Lunas") return "badge-green";
  if (status === "Sebagian") return "badge-yellow";
  return "badge-red";
}

export default function InvoiceTab({ password }) {
  const toast = useToast();
  const prompt = usePrompt();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.listInvoice();
      if (res.success) {
        setInvoices(res.data);
      } else {
        setError(res.message || "Gagal memuat data invoice.");
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

  function startEdit(inv) {
    setEditingId(inv.id);
    setForm({
      tanggalInvoice: inv.tanggalInvoice,
      tujuan: inv.tujuan,
      nominal: String(inv.nominal),
      jatuhTempo: inv.jatuhTempo,
      keterangan: inv.keterangan,
      nomorInvoice: inv.nomorInvoice,
    });
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      const res = await api.editInvoice(password, { id, ...form });
      if (res.success) {
        toast.success("Invoice berhasil diperbarui.");
        setEditingId(null);
        await load();
      } else {
        toast.error(res.message || "Gagal menyimpan perubahan.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTambahPembayaran(inv) {
    const sisa = inv.nominal - inv.totalDibayar;
    const result = await prompt(`Catat pembayaran untuk ${inv.nomorInvoice || inv.id} (sisa ${formatRupiah(sisa)})`, [
      { name: "nominal", label: "Nominal Pembayaran", type: "number", autoFocus: true, defaultValue: String(sisa) },
      { name: "catatan", label: "Catatan (opsional)", type: "text" },
    ]);
    if (!result) return;
    const nominal = Number(result.nominal);
    if (isNaN(nominal) || nominal <= 0) {
      toast.error("Nominal tidak valid.");
      return;
    }
    setPayingId(inv.id);
    try {
      const res = await api.adminTambahPembayaran(password, {
        idInvoice: inv.id,
        tanggalBayar: new Date().toISOString().slice(0, 10),
        nominalDibayar: nominal,
        catatan: result.catatan,
      });
      if (res.success) {
        toast.success("Pembayaran berhasil dicatat.");
        await load();
      } else {
        toast.error(res.message || "Gagal menyimpan pembayaran.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server: " + err.message);
    } finally {
      setPayingId(null);
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
        <SkeletonTable cols={10} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Tujuan</th>
              <th>Tgl Invoice</th>
              <th>Jatuh Tempo</th>
              <th>Nominal</th>
              <th>Dibayar</th>
              <th>Sisa</th>
              <th>Status</th>
              <th>PDF</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, idx) => {
              const selisih = hariSelisih(inv.jatuhTempo);
              const telat = inv.status !== "Lunas" && selisih !== null && selisih < 0;

              return editingId === inv.id ? (
                <tr key={inv.id} className="editing-row row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>
                    <input value={form.nomorInvoice} onChange={(e) => setForm({ ...form, nomorInvoice: e.target.value })} />
                  </td>
                  <td>
                    <input value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} />
                  </td>
                  <td>
                    <input type="date" value={form.tanggalInvoice} onChange={(e) => setForm({ ...form, tanggalInvoice: e.target.value })} />
                  </td>
                  <td>
                    <input type="date" value={form.jatuhTempo} onChange={(e) => setForm({ ...form, jatuhTempo: e.target.value })} />
                  </td>
                  <td>
                    <input type="number" value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} />
                  </td>
                  <td colSpan={2}>
                    <input
                      placeholder="Keterangan"
                      value={form.keterangan}
                      onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    />
                  </td>
                  <td colSpan={2}></td>
                  <td className="row-actions">
                    <button className="action-btn" disabled={saving} onClick={() => saveEdit(inv.id)}>
                      {saving ? "..." : "Simpan"}
                    </button>
                    <button className="secondary-btn" disabled={saving} onClick={() => setEditingId(null)}>
                      Batal
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={inv.id} className="row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <td>{inv.nomorInvoice || <span className="muted">-</span>}</td>
                  <td>{inv.tujuan}</td>
                  <td>{inv.tanggalInvoice}</td>
                  <td className={telat ? "overdue-cell" : ""}>
                    {inv.jatuhTempo}
                    {telat && <span className="overdue-tag"> (telat {Math.abs(selisih)} hari)</span>}
                  </td>
                  <td>{formatRupiah(inv.nominal)}</td>
                  <td>{formatRupiah(inv.totalDibayar)}</td>
                  <td>{formatRupiah(inv.nominal - inv.totalDibayar)}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(inv.status)} ${inv.status !== "Lunas" ? "pulse" : ""}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>{inv.linkPdf && <a href={inv.linkPdf} target="_blank" rel="noreferrer">Lihat</a>}</td>
                  <td className="row-actions">
                    <button className="action-btn" onClick={() => startEdit(inv)}>
                      Edit
                    </button>
                    {inv.status !== "Lunas" && (
                      <button
                        className="secondary-btn"
                        disabled={payingId === inv.id}
                        onClick={() => handleTambahPembayaran(inv)}
                      >
                        {payingId === inv.id ? "..." : "+ Bayar"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={10} className="muted center">
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
