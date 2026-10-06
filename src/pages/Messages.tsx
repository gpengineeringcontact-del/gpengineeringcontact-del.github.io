import { useEffect, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Messages() {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const search = trpc.contact.searchUsers.useQuery({ query }, { enabled: query.trim().length > 0 });
  const conversation = trpc.contact.conversation.useQuery({ userId: selectedId! }, { enabled: !!selectedId, refetchInterval: 3000 });
  const selected = search.data?.find((item) => item.id === selectedId);
  const send = trpc.contact.sendDirect.useMutation({ onSuccess: async () => { setText(""); await conversation.refetch(); } });
  const setTyping = trpc.contact.setTyping.useMutation();
  const typing = trpc.contact.isTyping.useQuery({ userId: selectedId! }, { enabled: !!selectedId, refetchInterval: 2000 });

  useEffect(() => {
    if (!selectedId || !text) return;
    const timer = window.setTimeout(() => setTyping.mutate({ recipientId: selectedId, typing: true }), 250);
    return () => window.clearTimeout(timer);
  }, [text, selectedId]);

  if (isLoading || !user) return <main className="min-h-screen bg-cream p-8" />;
  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl">
    <Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link>
    <h1 className="display-xl mt-10 text-5xl text-forest">Nachrichten</h1>
    <p className="mt-2 text-sagedark">Finde Menschen aus der Community über ihren Benutzernamen.</p>
    <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="card-offset p-4">
        <input className="input-line" placeholder="@Benutzername suchen …" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="mt-4 space-y-2">{search.data?.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl p-3 text-left ${selectedId === item.id ? "bg-tang/20" : "bg-paper"}`}><b>{item.name}</b><span className="block text-xs text-sagedark">@{item.username}</span></button>)}</div>
      </aside>
      <section className="card-offset flex min-h-[500px] flex-col p-5">
        {!selected ? <div className="m-auto text-center text-sagedark"><p className="text-lg font-semibold text-forest">Wähle einen Chat</p><p className="mt-2 text-sm">Suche nach einem Benutzernamen, um eine Nachricht zu schreiben.</p></div> : <>
          <header className="border-b border-forest/10 pb-4"><h2 className="text-xl font-bold text-forest">{selected.name}</h2><p className="text-sm text-sagedark">@{selected.username}</p></header>
          <div className="flex-1 space-y-3 overflow-y-auto py-5">{conversation.data?.map((item) => <div key={item.id} className={`flex ${item.senderId === user.id ? "justify-end" : "justify-start"}`}><p className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${item.senderId === user.id ? "bg-forest text-cream" : "bg-paper text-forest"}`}>{item.body}</p></div>)}</div>
          {typing.data?.typing && <p className="mb-2 text-xs italic text-sagedark">tippt gerade …</p>}
          <form className="flex gap-2 border-t border-forest/10 pt-4" onSubmit={(event) => { event.preventDefault(); if (selectedId && text.trim()) send.mutate({ recipientId: selectedId, body: text.trim() }); }}>
            <input className="input-line" placeholder="Nachricht schreiben …" value={text} onChange={(event) => setText(event.target.value)} />
            <button className="btn-tang" disabled={send.isPending || !text.trim()}>Senden</button>
          </form>
        </>}
      </section>
    </div>
  </div></main>;
}
