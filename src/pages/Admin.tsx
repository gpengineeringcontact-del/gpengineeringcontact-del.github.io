import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

type Section = "users" | "reports" | "inbox";

export default function Admin() {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [section, setSection] = useState<Section>("users");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [messageUserId, setMessageUserId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const users = trpc.forum.listUsers.useQuery(undefined, { enabled: user?.role === "admin" });
  const reports = trpc.forum.listReports.useQuery(undefined, { enabled: user?.role === "admin" });
  const inbox = trpc.forum.listAdminInbox.useQuery(undefined, { enabled: user?.role === "admin" });
  const refresh = async () => Promise.all([users.refetch(), reports.refetch(), inbox.refetch()]);
  const updateUser = trpc.forum.updateUser.useMutation({ onSuccess: refresh });
  const deleteUser = trpc.forum.deleteUser.useMutation({ onSuccess: refresh });
  const resolve = trpc.forum.resolveReport.useMutation({ onSuccess: refresh });
  const deletePost = trpc.forum.deletePost.useMutation({ onSuccess: refresh });
  const deleteThread = trpc.forum.deleteThread.useMutation({ onSuccess: refresh });
  const sendMessage = trpc.forum.messageUser.useMutation({ onSuccess: () => { setMessageUserId(null); setSubject(""); setMessage(""); } });
  const filteredUsers = users.data?.filter((item) => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return true;
    return `${item.name ?? ""} ${item.email ?? ""}`.toLowerCase().includes(query);
  });

  if (isLoading) return <main className="min-h-screen bg-cream p-8" />;
  if (!user || user.role !== "admin") return <main className="min-h-screen bg-cream px-5 py-20"><div className="mx-auto max-w-xl card-offset p-8">
    <h1 className="display-xl text-4xl text-forest">Kein Admin-Zugriff</h1>
    <p className="mt-4 text-sagedark">Diese Seite ist nur für Moderationsteams verfügbar.</p>
    <Link className="btn-outline mt-6" to="/">Zurück zu Wyfare</Link>
  </div></main>;

  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link>
      <h1 className="display-xl mt-10 text-5xl text-forest">Admin-Zentrale</h1>
      <p className="mt-3 text-sagedark">Konten, Zugänge, Inhalte, Meldungen und Anfragen verwalten.</p>
      <nav className="mt-8 flex flex-wrap gap-2 border-b border-forest/15 pb-3">
        {([["users", "Konten"], ["reports", "Meldungen"], ["inbox", "Posteingang"]] as const).map(([id, label]) =>
          <button key={id} onClick={() => setSection(id)} className={`rounded-full px-4 py-2 text-sm font-bold ${section === id ? "bg-forest text-cream" : "bg-paper text-forest"}`}>{label}</button>)}
      </nav>

      {section === "users" && <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-forest">Alle Konten ({users.data?.length ?? 0})</h2>
          <input
            className="input-line"
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Nach Name oder E-Mail suchen …"
            aria-label="Konten nach Name oder E-Mail suchen"
          />
          <p className="text-xs text-sagedark">{filteredUsers?.length ?? 0} von {users.data?.length ?? 0} Konten</p>
          {filteredUsers?.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full rounded-xl border p-4 text-left ${selectedId === item.id ? "border-tang bg-tang/10" : "border-forest/15 bg-paper"}`}>
            <span className="flex items-center justify-between gap-3"><strong>{item.name ?? "Ohne Namen"}</strong><span className="text-xs">{item.role === "admin" ? "Admin" : item.membershipStatus === "active" ? "Premium" : "Free"}</span></span>
            <span className="mt-1 block text-xs text-sagedark">{item.email ?? "keine E-Mail"} · {item.isActive ? "aktiv" : "deaktiviert"}</span>
          </button>)}
          {filteredUsers?.length === 0 && <p className="rounded-lg bg-forest/10 p-4 text-sm text-sagedark">Kein Konto gefunden.</p>}
        </div>
        <UserEditor
          key={selectedId ?? "empty"}
          user={users.data?.find((item) => item.id === selectedId)}
          onSave={(input) => updateUser.mutate(input)}
          onDelete={(id) => { if (window.confirm("Konto wirklich löschen?")) deleteUser.mutate({ userId: id }); }}
          onMessage={(id) => setMessageUserId(id)}
          saving={updateUser.isPending}
        />
      </section>}

      {section === "reports" && <section className="mt-6 space-y-4">
        <h2 className="text-xl font-bold text-forest">Offene Meldungen</h2>
        {reports.data?.map((report) => <article key={report.id} className="card-offset p-6">
          <p className="label-caps text-tang">{report.reason}</p>
          <p className="mt-2 text-sm text-sagedark">Von {report.reporter?.name ?? "unbekannt"} am {new Date(report.createdAt).toLocaleString("de-DE")}</p>
          {report.details && <p className="mt-3 rounded-lg bg-paper p-3 text-sm">{report.details}</p>}
          {report.post && <p className="mt-3 text-sm"><b>Beitrag:</b> {report.post.caption}</p>}
          {report.thread && <p className="mt-3 text-sm"><b>Thread:</b> {report.thread.title}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-outline" onClick={() => resolve.mutate({ reportId: report.id })}>Erledigt</button>
            {report.post && <button className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700" onClick={() => { if (window.confirm("Beitrag löschen?")) deletePost.mutate({ postId: report.post!.id }); }}>Beitrag löschen</button>}
            {report.thread && <button className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700" onClick={() => { if (window.confirm("Thread löschen?")) deleteThread.mutate({ threadId: report.thread!.id }); }}>Thread löschen</button>}
          </div>
        </article>)}
        {reports.data?.length === 0 && <p className="rounded-lg bg-forest/10 p-4 text-forest">Keine offenen Meldungen.</p>}
      </section>}

      {section === "inbox" && <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div><h2 className="text-xl font-bold text-forest">Kontaktanfragen</h2>{inbox.data?.contacts.map((item) => <article key={item.id} className="card-offset mt-3 p-5"><b>{item.name}</b><p className="text-xs text-sagedark">{item.email}</p><p className="mt-3 text-sm">{item.message}</p></article>)}</div>
        <div><h2 className="text-xl font-bold text-forest">Lizenzanfragen</h2>{inbox.data?.licenses.map((item) => <article key={item.id} className="card-offset mt-3 p-5"><b>{item.company}</b><p className="text-xs text-sagedark">{item.email}</p><p className="mt-3 text-sm">{item.message ?? "Keine Nachricht"}</p></article>)}</div>
      </section>}

      {messageUserId && <div className="fixed inset-0 z-50 grid place-items-center bg-forest/40 p-5"><form className="card-offset w-full max-w-lg bg-cream p-7" onSubmit={(event) => { event.preventDefault(); sendMessage.mutate({ userId: messageUserId, subject, message }); }}>
        <h2 className="text-2xl font-bold text-forest">Nutzer anschreiben</h2>
        <input className="input-line mt-5" placeholder="Betreff" value={subject} onChange={(event) => setSubject(event.target.value)} required />
        <textarea className="input-line mt-4 min-h-32" placeholder="Nachricht" value={message} onChange={(event) => setMessage(event.target.value)} required />
        <div className="mt-5 flex gap-3"><button type="button" className="btn-outline" onClick={() => setMessageUserId(null)}>Abbrechen</button><button className="btn-tang" disabled={sendMessage.isPending}>Senden</button></div>
      </form></div>}
    </div>
  </main>;
}

function UserEditor({ user, onSave, onDelete, onMessage, saving }: {
  user?: { id: number; name: string | null; role: string; membershipStatus: string; isActive: boolean; exchangeRole: string | null; email: string | null };
  onSave: (input: { userId: number; name: string; role: "user" | "admin"; membershipStatus: "free" | "active"; isActive: boolean; exchangeRole: "planung" | "im_ausland" | "alumni" | null }) => void;
  onDelete: (id: number) => void;
  onMessage: (id: number) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<"user" | "admin">((user?.role as "user" | "admin") ?? "user");
  const [membershipStatus, setMembershipStatus] = useState<"free" | "active">((user?.membershipStatus as "free" | "active") ?? "free");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [exchangeRole, setExchangeRole] = useState<"planung" | "im_ausland" | "alumni" | "">(
    (user?.exchangeRole as "planung" | "im_ausland" | "alumni" | "") ?? "",
  );
  if (!user) return <div className="card-offset p-8 text-sagedark">Wähle links ein Konto aus, um es zu bearbeiten.</div>;
  return <div className="card-offset p-6 sm:p-8"><h2 className="text-2xl font-bold text-forest">Konto bearbeiten</h2><p className="mt-1 text-sm text-sagedark">{user.email ?? "keine E-Mail"}</p>
    <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSave({ userId: user.id, name, role, membershipStatus, isActive, exchangeRole: exchangeRole || null }); }}>
      <input className="input-line" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
      <select className="input-line" value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="user">Nutzer</option><option value="admin">Admin</option></select>
      <select className="input-line" value={membershipStatus} onChange={(event) => setMembershipStatus(event.target.value as typeof membershipStatus)}><option value="free">Free</option><option value="active">Premium</option></select>
      <select className="input-line" value={exchangeRole} onChange={(event) => setExchangeRole(event.target.value as typeof exchangeRole)}><option value="">Status nicht festgelegt</option><option value="planung">Plant</option><option value="im_ausland">Im Ausland</option><option value="alumni">Alumni</option></select>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Konto aktiv</label>
      <div className="flex flex-wrap gap-3"><button className="btn-tang" disabled={saving}>Speichern</button><button type="button" className="btn-outline" onClick={() => onMessage(user.id)}>Nachricht senden</button><button type="button" className="rounded-full border border-red-300 px-5 py-2.5 text-xs font-bold text-red-700" onClick={() => onDelete(user.id)}>Konto löschen</button></div>
    </form>
  </div>;
}
