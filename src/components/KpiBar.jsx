import { useCountUp } from "../hooks/useCountUp.js";

const formatRupiah = (n) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

function KpiCard({ label, value, format, accent, delay }) {
  const animated = useCountUp(value);
  const text = format === "rupiah" ? formatRupiah(animated) : Math.round(animated).toLocaleString("id-ID");
  return (
    <div className={`kpi-card kpi-${accent}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-value">{text}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

export default function KpiBar({ stats, loading }) {
  if (loading) {
    return (
      <div className="kpi-bar">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kpi-card kpi-skeleton" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-bar">
      <KpiCard label="Karyawan Aktif" value={stats.jumlahKaryawan} accent="blue" delay={0} />
      <KpiCard label="Bon Menunggu" value={stats.bonMenunggu} accent="yellow" delay={80} />
      <KpiCard label="Invoice Telat" value={stats.invoiceTelat} accent="red" delay={160} />
      <KpiCard label="Total Saldo Operasional" value={stats.totalSaldoOperasional} format="rupiah" accent="green" delay={240} />
    </div>
  );
}
