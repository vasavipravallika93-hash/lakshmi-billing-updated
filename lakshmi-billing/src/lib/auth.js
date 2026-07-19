// Single-owner login. There is only ONE user — no roles, no user table.
// Credentials live in environment variables (set in Vercel dashboard, never
// committed to git). The session flag lives in localStorage on this device.

const SESSION_KEY = "le_session";

export function login(email, password) {
  const validEmail = import.meta.env.VITE_OWNER_EMAIL;
  const validPassword = import.meta.env.VITE_OWNER_PASSWORD;

  if (!validEmail || !validPassword) {
    return { ok: false, error: "Login is not configured. Set VITE_OWNER_EMAIL and VITE_OWNER_PASSWORD in your .env file." };
  }
  if (email.trim().toLowerCase() === validEmail.trim().toLowerCase() && password === validPassword) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, at: Date.now() }));
    return { ok: true };
  }
  return { ok: false, error: "Incorrect email or password." };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY);
}

export function currentSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
