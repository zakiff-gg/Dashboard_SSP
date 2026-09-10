import { useState } from "react";
import { api } from "../api.js";

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.adminLogin(password);
      if (res.status === "SUKSES") {
        onSuccess(password);
      } else {
        setError(res.pesan || "Password salah.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Dashboard Admin SSP</h1>
        <p className="muted">Masukkan password admin untuk melanjutkan.</p>
        <input
          type="password"
          placeholder="Password admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <div className="error-text">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
