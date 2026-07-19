import React, { useState } from "react";
import { login } from "../lib/auth";
import { LockKeyhole } from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const res = login(email, password);
    if (res.ok) onLogin();
    else setError(res.error);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-xl2 shadow-card p-8">
        <div className="h-12 w-12 rounded-xl bg-brand-500 text-white grid place-items-center font-display font-bold mb-4">
          LE
        </div>
        <h1 className="font-display font-bold text-xl">Lakshmi Engineering</h1>
        <p className="text-sm text-ink/50 mb-6">Sign in to your billing studio</p>

        <label className="text-xs font-semibold text-ink/60">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="you@lakshmienginerring.com"
        />
        <label className="text-xs font-semibold text-ink/60">Password</label>
        <div className="relative mt-1 mb-4">
          <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="••••••••"
          />
        </div>

        {error && <div className="text-sm text-red-500 mb-3">{error}</div>}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition"
        >
          Log in
        </button>
        <p className="text-[11px] text-ink/40 mt-4 text-center">
          Single-owner login — credentials set via environment variables.
        </p>
      </form>
    </div>
  );
}
