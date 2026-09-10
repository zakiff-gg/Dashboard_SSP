import { useState } from "react";
import Login from "./components/Login.jsx";
import BonTab from "./components/BonTab.jsx";
import OperasionalTab from "./components/OperasionalTab.jsx";
import InvoiceTab from "./components/InvoiceTab.jsx";

const SESSION_KEY = "ssp_dashboard_password";

export default function App() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || "");
  const [tab, setTab] = useState("bon");

  function handleLoginSuccess(pw) {
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword("");
  }

  if (!password) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Dashboard Admin SSP</h1>
        <button className="secondary-btn" onClick={handleLogout}>
          Keluar
        </button>
      </header>

      <nav className="tabs">
        <button className={tab === "bon" ? "active" : ""} onClick={() => setTab("bon")}>
          Bon
        </button>
        <button className={tab === "operasional" ? "active" : ""} onClick={() => setTab("operasional")}>
          Operasional
        </button>
        <button className={tab === "invoice" ? "active" : ""} onClick={() => setTab("invoice")}>
          Invoice
        </button>
      </nav>

      <main>
        {tab === "bon" && <BonTab password={password} />}
        {tab === "operasional" && <OperasionalTab password={password} />}
        {tab === "invoice" && <InvoiceTab password={password} />}
      </main>
    </div>
  );
}
