import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useToast } from "./Toast.jsx";
import { useConfirm } from "./ConfirmDialog.jsx";
import { SkeletonTable } from "./Skeleton.jsx";

const formatRupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export default function BonTab({ password }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [bon, setBon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingRow, setProcessingRow] = useState(null);
  const [filter, setFilter] = useState("MENUNGGU"); // MENUNGGU | SEMUA

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getBonAll(password);
      if (res.status === "SUKSES") {
        setBon(res.bon);
      } else {
        setError(res.pesan || "Gagal memuat data bon.");
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

  async function handleCairkan(rowIndex) {
    const ok = await confirm("Tandai bon ini sebagai CAIR? Aksi ini tidak bisa dibatalkan dari sini.");
    if (!ok) return;
    setProcessingRow(rowIndex);
    try {
      const res = await api.cairkanBon(password, rowIndex);
      if (res.status === "SUKSES") {
        toast.success("Bon berhasil ditandai cair.");
        await load();
      } else {
        toast.error(res.pesan || "Gagal mencairkan bon.");
      }
    } catch (err) {
      toast.error("Gagal terhubung ke server: " + err.message);
    } finally {
      setProcessingRow(null);
    }
  }

  const shown = filter === "MENUNGGU" ? bon.filter((b) => b.status === "Menunggu Pencairan") : bon;

  return (
    <div>
      <div className="toolbar">
        <div className="filter-group">
          <button className={filter === "MENUNGGU" ? "active" : ""} onClick={() => setFilter("MENUNGGU")}>
            Menunggu Pencairan
          </button>
          <button className={filter === "SEMUA" ? "active" : ""} onClick={() => setFilter("SEMUA")}>
            Semua Riwayat
          </button>
        </div>
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {loading ? (
        <SkeletonTable cols={6} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tanggal Pengajuan</th>
              <th>Jumlah</th>
              <th>Status</th>
              <th>Tanggal Cair</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((b, idx) => (
              <tr key={b.rowIndex} className="row-in" style={{ animationDelay: `${idx * 25}ms` }}>
                <td>{b.nama}</td>
                <td>{b.tanggalPengajuan}</td>
                <td>{formatRupiah(b.jumlah)}</td>
                <td>
                  <span className={`badge ${b.status === "Cair" ? "badge-green" : "badge-yellow pulse"}`}>{b.status}</span>
                </td>
                <td>{b.tanggalCair || "-"}</td>
                <td>
                  {b.status !== "Cair" && (
                    <button
                      className="action-btn"
                      disabled={processingRow === b.rowIndex}
                      onClick={() => handleCairkan(b.rowIndex)}
                    >
                      {processingRow === b.rowIndex ? "Memproses..." : "Cairkan"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center">
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
