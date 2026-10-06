import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = trpc.auth.requestPasswordReset.useMutation({ onSuccess: () => setSent(true) });
  return <main className="min-h-screen bg-cream px-5 py-20"><div className="card-offset mx-auto max-w-md p-8">
    <h1 className="display-xl text-4xl text-forest">Passwort zurücksetzen</h1>
    {sent ? <p className="mt-5 text-sagedark">Wenn ein Konto existiert, wurde eine E-Mail mit einem Link verschickt.</p> : <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ email }); }}>
      <input className="input-line" type="email" required placeholder="E-Mail-Adresse" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn-tang w-full" disabled={mutation.isPending}>Link senden</button>
      {mutation.error && <p className="text-sm text-red-700">{mutation.error.message}</p>}
    </form>}
    <Link className="mt-6 block text-sm text-forest underline" to="/login">Zurück zum Login</Link>
  </div></main>;
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const mutation = trpc.auth.resetPassword.useMutation({ onSuccess: () => setDone(true) });
  return <main className="min-h-screen bg-cream px-5 py-20"><div className="card-offset mx-auto max-w-md p-8">
    <h1 className="display-xl text-4xl text-forest">Neues Passwort</h1>
    {done ? <p className="mt-5 text-sagedark">Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.</p> : <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ token: params.get("token") ?? "", password }); }}>
      <input className="input-line" type="password" minLength={8} required placeholder="Neues Passwort (mindestens 8 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn-tang w-full" disabled={mutation.isPending}>Passwort speichern</button>
      {mutation.error && <p className="text-sm text-red-700">{mutation.error.message}</p>}
    </form>}
    <Link className="mt-6 block text-sm text-forest underline" to="/login">Zum Login</Link>
  </div></main>;
}
