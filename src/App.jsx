import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import BonTab from "./components/BonTab.jsx";
import OperasionalTab from "./components/OperasionalTab.jsx";
import InvoiceTab from "./components/InvoiceTab.jsx";
import AbsensiTab from "./components/AbsensiTab.jsx";
import GajiTab from "./components/GajiTab.jsx";
import KpiBar from "./components/KpiBar.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";
import { PromptProvider } from "./components/PromptDialog.jsx";
import { api } from "./api.js";

const SESSION_KEY = "ssp_dashboard_password";

const TABS = [
  { id: "bon", label: "Bon" },
  { id: "operasional", label: "Operasional" },
  { id: "invoice", label: "Invoice" },
  { id: "absensi", label: "Absensi" },
  { id: "gaji", label: "Gaji" },
];

function DashboardShell({ password, onLogout }) {
  const [tab, setTab] = useState("bon");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const [karyawanRes, bonRes, invoiceRes] = await Promise.all([
          api.getKaryawan(),
          api.getBonAll(password),
          api.listInvoice(),
        ]);
        if (cancelled) return;

        const jumlahKaryawan = karyawanRes.status === "SUKSES" ? karyawanRes.karyawan.length : 0;
        const totalSaldoOperasional =
          karyawanRes.status === "SUKSES"
            ? karyawanRes.karyawan.reduce((sum, k) => sum + (k.saldoOperasional || 0), 0)
            : 0;
        const bonMenunggu = bonRes.status === "SUKSES" ? bonRes.bon.filter((b) => b.status !== "Cair").length : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const invoiceTelat =
          invoiceRes.success
            ? invoiceRes.data.filter((inv) => {
                if (inv.status === "Lunas" || !inv.jatuhTempo) return false;
                const jt = new Date(inv.jatuhTempo + "T00:00:00");
                return jt < today;
              }).length
            : 0;

        setStats({ jumlahKaryawan, totalSaldoOperasional, bonMenunggu, invoiceTelat });
      } catch (e) {
        // KPI bar bersifat pelengkap -- kalau gagal, biarkan saja tabnya tetap jalan normal.
        setStats({ jumlahKaryawan: 0, totalSaldoOperasional: 0, bonMenunggu: 0, invoiceTelat: 0 });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [password]);

  const activeIndex = TABS.findIndex((t) => t.id === tab);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Dashboard Admin SSP</h1>
        <button className="secondary-btn" onClick={onLogout}>
          Keluar
        </button>
      </header>

      <KpiBar stats={stats || {}} loading={statsLoading} />

      <nav className="tabs" style={{ "--tab-count": TABS.length }}>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <div className="tab-underline" style={{ transform: `translateX(${activeIndex * 100}%)`, width: `${100 / TABS.length}%` }} />
      </nav>

      <main key={tab} className="tab-panel">
        {tab === "bon" && <BonTab password={password} />}
        {tab === "operasional" && <OperasionalTab password={password} />}
        {tab === "invoice" && <InvoiceTab password={password} />}
        {tab === "absensi" && <AbsensiTab password={password} />}
        {tab === "gaji" && <GajiTab password={password} />}
      </main>
    </div>
  );
}

export default function App() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || "");

  function handleLoginSuccess(pw) {
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword("");
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <PromptProvider>
          {!password ? <Login onSuccess={handleLoginSuccess} /> : <DashboardShell password={password} onLogout={handleLogout} />}
        </PromptProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
