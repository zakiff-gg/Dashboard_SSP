import { useState } from "react";
import AbsensiRekap from "./AbsensiRekap.jsx";
import AbsensiDetail from "./AbsensiDetail.jsx";

export default function AbsensiTab({ password }) {
  const [view, setView] = useState("rekap");

  return (
    <div>
      <div className="subnav">
        <button className={view === "rekap" ? "active" : ""} onClick={() => setView("rekap")}>
          Rekap Bulanan
        </button>
        <button className={view === "detail" ? "active" : ""} onClick={() => setView("detail")}>
          Detail &amp; Edit Lembur
        </button>
      </div>
      <div key={view} className="subnav-panel">
        {view === "rekap" && <AbsensiRekap />}
        {view === "detail" && <AbsensiDetail password={password} />}
      </div>
    </div>
  );
}
