import { Link, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { useState } from "react";

export default function Profile() {
  const { userId } = useParams();
  const id = Number(userId);
  const profile = trpc.contact.profile.useQuery({ userId: id }, { enabled: Number.isInteger(id) && id > 0 });
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const report = trpc.contact.reportUser.useMutation({ onSuccess: () => setReported(true) });
  const block = trpc.contact.blockUser.useMutation({ onSuccess: () => setBlocked((value) => !value) });
  if (profile.isLoading) return <main className="min-h-screen bg-cream p-8" />;
  if (!profile.data) return <main className="min-h-screen bg-cream p-8">Profil nicht gefunden.</main>;
  const person = profile.data.user;
  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link to="/nachrichten" className="text-sm font-semibold text-forest underline">← Zurück zu Nachrichten</Link>
    <section className="card-offset mt-8 flex flex-wrap items-center justify-between gap-5 p-7">
      <div><span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest font-display text-xl font-bold uppercase text-cream">{(person.name ?? "?").slice(0, 2)}</span><h1 className="display-xl mt-4 text-4xl text-forest">{person.name}</h1><p className="text-sagedark">@{person.username}</p></div>
      <div className="flex flex-wrap gap-2"><Link to={`/nachrichten?user=${person.id}`} className="btn-tang">Nachricht</Link><button className="btn-outline" onClick={() => block.mutate({ userId: person.id, blocked: !blocked })}>{blocked ? "Entsperren" : "Blockieren"}</button><button className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700" onClick={() => { if (window.confirm("Profil melden?")) report.mutate({ userId: person.id, reason: "Profil melden" }); }}>Melden</button></div>
    </section>
    {reported && <p className="mt-4 rounded-lg bg-forest/10 p-3 text-sm text-forest">Danke, die Meldung wurde übermittelt.</p>}
    <h2 className="display-xl mt-10 text-3xl text-forest">Beiträge</h2>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{profile.data.posts.map((post) => <article key={post.id} className="card-offset p-5">{post.imageUrl && <img src={post.imageUrl} alt="" className="mb-4 max-h-64 w-full rounded-xl object-cover" />}<p className="font-hand text-2xl text-forest">{post.caption}</p><p className="mt-3 text-xs text-sagedark">{post.country}{post.locationLabel ? ` · ${post.locationLabel}` : ""}</p></article>)}</div>
  </div></main>;
}
