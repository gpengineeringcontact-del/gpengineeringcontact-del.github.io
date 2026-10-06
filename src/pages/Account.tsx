import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Account() {
  const navigate = useNavigate();
  const { user, isLoading, refresh } = useAuth({ redirectOnUnauthenticated: true });
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [exchangeRole, setExchangeRole] = useState<"planung" | "im_ausland" | "alumni" | "">("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"weiblich" | "männlich" | "divers" | "keine Angabe" | "">("");
  const [desiredCountry, setDesiredCountry] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setUsername(user.username ?? "");
      setExchangeRole((user.exchangeRole as typeof exchangeRole) ?? "");
      setAge(user.age?.toString() ?? "");
      setGender((user.gender as typeof gender) ?? "");
      setDesiredCountry(user.desiredCountry ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => { setMessage("Profil gespeichert."); setError(""); await refresh(); },
    onError: (err) => setError(err.message),
  });
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => { setMessage("Passwort geändert."); setError(""); setCurrentPassword(""); setNewPassword(""); },
    onError: (err) => setError(err.message),
  });
  const exportData = trpc.auth.exportData.useQuery(undefined, { enabled: false });
  const deleteAccount = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => navigate("/login"),
    onError: (err) => setError(err.message),
  });

  const downloadData = async () => {
    const result = await exportData.refetch();
    if (!result.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wyfare-datenexport.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !user) return <main className="min-h-screen bg-cream p-8" />;

  return (
    <main className="min-h-screen bg-cream px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link>
        <h1 className="display-xl mt-10 text-5xl text-forest">Dein Konto</h1>
        <p className="mt-3 text-sagedark">{user.email}</p>
        {message && <p className="mt-5 rounded-lg bg-forest/10 p-3 text-sm text-forest">{message}</p>}
        {error && <p className="mt-5 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>}

        <section className="card-offset mt-8 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-forest">Profil</h2>
          <form className="mt-5 space-y-4" onSubmit={(event) => {
            event.preventDefault();
            updateProfile.mutate({ name, username, exchangeRole: exchangeRole || null, age: age ? Number(age) : null, gender: gender || null, desiredCountry: desiredCountry || null, bio: bio || null });
          }}>
            <input className="input-line" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={255} required />
            <input className="input-line" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_.-]{3,30}" required placeholder="Benutzername" />
            <select className="input-line" value={exchangeRole} onChange={(event) => setExchangeRole(event.target.value as typeof exchangeRole)}>
              <option value="">Noch nicht festgelegt</option>
              <option value="planung">Ich plane mein Auslandsjahr</option>
              <option value="im_ausland">Ich bin gerade im Ausland</option>
              <option value="alumni">Ich bin Alumni</option>
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="input-line" type="number" min={13} max={100} placeholder="Alter (optional)" value={age} onChange={(event) => setAge(event.target.value)} />
              <select className="input-line" value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}>
                <option value="">Geschlecht nicht angeben</option><option value="weiblich">Weiblich</option><option value="männlich">Männlich</option><option value="divers">Divers</option><option value="keine Angabe">Keine Angabe</option>
              </select>
            </div>
            <input className="input-line" placeholder="Wunschland oder Wunschregion" maxLength={120} value={desiredCountry} onChange={(event) => setDesiredCountry(event.target.value)} />
            <textarea className="input-line min-h-28 resize-y" placeholder="Deine Bio – was sollte die Community über dich wissen?" maxLength={500} value={bio} onChange={(event) => setBio(event.target.value)} />
            <button className="btn-tang" disabled={updateProfile.isPending}>Profil speichern</button>
          </form>
        </section>

        <section className="card-offset mt-6 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-forest">Passwort ändern</h2>
          <form className="mt-5 space-y-4" onSubmit={(event) => {
            event.preventDefault();
            changePassword.mutate({ currentPassword, newPassword });
          }}>
            <input className="input-line" type="password" placeholder="Aktuelles Passwort" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            <input className="input-line" type="password" placeholder="Neues Passwort (mindestens 8 Zeichen)" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <button className="btn-tang" disabled={changePassword.isPending}>Passwort ändern</button>
          </form>
        </section>

        <section className="card-offset mt-6 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-forest">Deine Daten</h2>
          <p className="mt-2 text-sm leading-relaxed text-sagedark">Lade deine gespeicherten Kontodaten als JSON herunter oder lösche dein Konto dauerhaft.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-outline" onClick={downloadData} disabled={exportData.isFetching}>Daten exportieren</button>
            <button className="rounded-lg border border-red-300 px-4 py-3 text-sm font-semibold text-red-700" onClick={() => {
              if (window.confirm("Möchtest du dein Konto wirklich löschen?")) deleteAccount.mutate();
            }} disabled={deleteAccount.isPending}>Konto löschen</button>
          </div>
        </section>
      </div>
    </main>
  );
}
