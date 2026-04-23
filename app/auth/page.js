"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell auth-shell">
      <section className="card auth-card">
        <span className="brand-block">
          <img src="/pravideon-logo.png" alt="Expa AI logo" className="brand-logo" />
          <span className="brand-mark">Expa AI</span>
        </span>
        <p className="history-kicker">Expa AI access</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="topbar__sub">Use your account to keep analyses private to your personal workspaces.</p>

        <form className="analysis-panel" onSubmit={submit}>
          {mode === "register" ? (
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </label>
          ) : null}

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>

          {error ? <p className="analysis-panel__error">{error}</p> : null}
        </form>

        <div className="auth-switch-row">
          <button className="subtle-btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
          <Link href="/" className="subtle-btn">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
