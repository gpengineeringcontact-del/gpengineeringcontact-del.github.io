import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { BrandMark } from "@/components/BrandMark";
import { IconApple, IconGoogle, IconPlane } from "@/components/icons";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [error, setError] = useState("");
  const startProvider = (provider: "google" | "apple") => {
    const url = provider === "google" ? import.meta.env.VITE_GOOGLE_AUTH_URL : import.meta.env.VITE_APPLE_AUTH_URL;
    if (url) window.location.href = url;
    else setError(`${provider === "google" ? "Google" : "Apple"}-Anmeldung ist noch nicht konfiguriert. Nutze bis dahin deine E-Mail-Adresse.`);
  };

  const login = trpc.auth.login.useMutation({ onSuccess: () => navigate("/") });
  const register = trpc.auth.register.useMutation({ onSuccess: () => navigate("/") });
  const pending = login.isPending || register.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    const onError = (err: { message: string }) => setError(err.message);
    if (mode === "login") login.mutate({ email: normalizedEmail, password }, { onError });
    else register.mutate({ name: name.trim(), username: username.trim(), email: normalizedEmail, password, plan }, { onError });
  };

  return (
    <div className="min-h-screen bg-cream px-5 py-7">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" aria-label="Wyfare Startseite">
          <BrandMark />
        </Link>
        <Link to="/" className="text-sm text-sagedark hover:text-forest">Zurück zum Feed</Link>
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-14 py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="label-caps mb-4 text-tang">Deine Reise, deine Menschen</p>
          <h1 className="display-xl max-w-xl text-5xl sm:text-7xl">Einloggen. Erzählen. Ankommen.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-sagedark">
            Ein ruhiger Ort für echte Erfahrungen rund ums Auslandsjahr. Ohne
            Hochglanzsprache, ohne Algorithmus-Show – einfach Menschen, die zuhören.
          </p>
        </div>
        <div className="card-offset p-7 sm:p-9">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-tang text-cream"><IconPlane className="h-6 w-6" /></div>
          <div className="mb-7 flex border-b border-forest/15">
            {(["login", "register"] as const).map((item) => (
              <button key={item} onClick={() => setMode(item)} className={`mr-6 pb-3 text-sm font-semibold ${mode === item ? "border-b-2 border-tang text-forest" : "text-sagedark"}`}>
                {item === "login" ? "Anmelden" : "Konto erstellen"}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            <button className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white px-4 text-sm font-semibold text-[#3c4043] shadow-sm transition-colors hover:bg-[#f8fafd]" type="button" onClick={() => startProvider("google")}>
              <IconGoogle className="h-5 w-5" /> Mit Google anmelden
            </button>
            <button className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-black px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f1f1f]" type="button" onClick={() => startProvider("apple")}>
              <IconApple className="h-5 w-5" /> Mit Apple anmelden
            </button>
          </div>
          <div className="my-6 flex items-center gap-3 text-[11px] text-sagedark"><span className="h-px flex-1 bg-forest/15" />oder mit E-Mail<span className="h-px flex-1 bg-forest/15" /></div>
          <form onSubmit={submit} noValidate className="space-y-3">
            {mode === "register" && <input className="input-line" placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />}
            {mode === "register" && <input className="input-line" placeholder="Benutzername (z. B. lea_ausland)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_.-]{3,30}" />}
            {mode === "register" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setPlan("free")} className={`border-2 p-3 text-left ${plan === "free" ? "border-forest bg-forest text-cream" : "border-forest/15"}`}>
                  <span className="block text-sm font-bold">Kostenlos</span>
                  <span className={`mt-1 block text-xs ${plan === "free" ? "text-cream/70" : "text-sagedark"}`}>Feed lesen + Wyfare Q&A</span>
                </button>
                <button type="button" onClick={() => setPlan("premium")} className={`border-2 p-3 text-left ${plan === "premium" ? "border-tang bg-tang text-forest" : "border-forest/15"}`}>
                  <span className="block text-sm font-bold">Wyfare Zugang</span>
                  <span className={`mt-1 block text-xs ${plan === "premium" ? "text-forest/75" : "text-sagedark"}`}>Einmalig 25 € · alles frei</span>
                </button>
              </div>
            )}
            <input className="input-line" type="email" placeholder="E-Mail-Adresse" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input-line" type="password" placeholder="Passwort (mindestens 8 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : 1} />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button className="btn-tang mt-3 w-full" disabled={pending}>{pending ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}</button>
          </form>
          {mode === "login" && <Link to="/passwort-vergessen" className="mt-4 block text-center text-sm text-forest underline">Passwort vergessen?</Link>}
          <p className="mt-4 text-center text-[11px] text-sagedark">{mode === "register" && plan === "premium" ? "Einmalig 25 € · Zahlung wird im nächsten Schritt eingerichtet" : "Kostenlos · Feed lesen und Wyfare Q&A nutzen"}</p>
        </div>
      </div>
    </div>
  );
}
