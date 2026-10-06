import { Link, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const id = Number(userId);
  const profile = trpc.contact.profile.useQuery({ userId: id }, { enabled: Number.isInteger(id) && id > 0 });
  const [reported, setReported] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("Belästigung oder unerwünschte Inhalte");
  const [details, setDetails] = useState("");
  const [blocked, setBlocked] = useState(false);
  const report = trpc.contact.reportUser.useMutation({ onSuccess: () => setReported(true) });
  const block = trpc.contact.blockUser.useMutation({ onSuccess: () => setBlocked((value) => !value) });
  if (profile.isLoading) return <main className="min-h-screen bg-cream p-8" />;
  if (profile.error) return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl"><Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link><section className="card-offset mt-8 p-8"><h1 className="font-display text-2xl font-bold text-forest">Profil konnte nicht geladen werden</h1><p className="mt-2 text-sm text-sagedark">{profile.error.message}</p></section></div></main>;
  if (!profile.data) return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl"><Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link><section className="card-offset mt-8 p-8"><h1 className="font-display text-2xl font-bold text-forest">Profil nicht gefunden</h1><p className="mt-2 text-sm text-sagedark">Dieses Profil ist nicht verfügbar.</p></section></div></main>;
  const person = profile.data.user;
  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link to="/nachrichten" className="text-sm font-semibold text-forest underline">← Zurück zu Nachrichten</Link>
    <section className="card-offset mt-8 flex flex-wrap items-center justify-between gap-5 p-7">
      <div className="min-w-0"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest font-display text-xl font-bold uppercase text-cream">{(person.name ?? "?").slice(0, 2)}</span><h1 className="display-xl mt-4 text-4xl text-forest">{person.name}</h1><p className="text-sagedark">@{person.username}</p><div className="mt-4 flex flex-wrap gap-2 text-sm text-sagedark">{person.age && <span>{person.age} Jahre</span>}{person.gender && <span>· {person.gender}</span>}{person.exchangeRole && <span>· {person.exchangeRole === "planung" ? "Plant sein Auslandsjahr" : person.exchangeRole === "im_ausland" ? "Gerade im Ausland" : "Alumni"}</span>}</div>{person.desiredCountry && <p className="mt-2 text-sm text-forest"><b>Wunschland:</b> {person.desiredCountry}</p>}{person.bio && <p className="mt-4 max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-forest/85">{person.bio}</p>}</div>
      <div className="flex flex-wrap gap-2">{user?.id === person.id ? <Link to="/konto" className="btn-tang">Profil bearbeiten</Link> : <Link to={`/nachrichten?user=${person.id}`} className="btn-tang">Anschreiben</Link>}<button className="btn-outline" onClick={() => block.mutate({ userId: person.id, blocked: !blocked })}>{blocked ? "Entsperren" : "Blockieren"}</button><button className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50" onClick={() => setReportOpen(true)}>Melden</button></div>
    </section>
    {reportOpen && <section className="card-offset mt-5 p-5"><div className="flex items-start justify-between gap-4"><div><p className="label-caps text-tang">Sicher melden</p><h2 className="mt-1 font-display text-xl font-bold text-forest">Was ist passiert?</h2></div><button className="text-2xl leading-none text-sagedark" onClick={() => setReportOpen(false)} aria-label="Meldung schließen">×</button></div><select className="input-line mt-4" value={reason} onChange={(event) => setReason(event.target.value)}><option>Belästigung oder unerwünschte Inhalte</option><option>Beleidigung oder Hassrede</option><option>Spam oder Werbung</option><option>Gefälschter Account</option><option>Etwas anderes</option></select><textarea className="input-line mt-3 min-h-24 resize-y" placeholder="Optional: Erzähl uns kurz mehr …" value={details} onChange={(event) => setDetails(event.target.value)} /><div className="mt-4 flex justify-end gap-2"><button className="btn-outline" onClick={() => setReportOpen(false)}>Abbrechen</button><button className="btn-tang" disabled={report.isPending} onClick={() => report.mutate({ userId: person.id, reason, details: details || undefined })}>Meldung senden</button></div></section>}
    {reported && <p className="mt-4 rounded-lg bg-forest/10 p-3 text-sm text-forest">Danke, die Meldung wurde übermittelt.</p>}
    <h2 className="display-xl mt-10 text-3xl text-forest">Beiträge</h2>
    {profile.data.posts.length === 0 ? <div className="mt-5 overflow-hidden rounded-3xl border border-forest/10 bg-paper p-10 text-center shadow-[8px_8px_0_#dfe5d9]"><div className="mx-auto flex h-16 w-16 rotate-[-6deg] items-center justify-center rounded-2xl bg-tang/30 text-3xl">✦</div><h3 className="mt-5 font-display text-2xl font-bold text-forest">Noch ganz ruhig hier</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-sagedark">Es gibt noch keine Beiträge von {person.name}. Vielleicht kommt bald das erste Abenteuer dazu.</p></div> : <div className="mt-5 grid gap-4 sm:grid-cols-2">{profile.data.posts.map((post) => <article key={post.id} className="card-offset p-5">{post.imageUrl && <img src={post.imageUrl} alt="" className="mb-4 max-h-64 w-full rounded-xl object-cover" />}<p className="font-hand text-2xl text-forest">{post.caption}</p><p className="mt-3 text-xs text-sagedark">{post.country}{post.locationLabel ? ` · ${post.locationLabel}` : ""}</p></article>)}</div>}
  </div></main>;
}
