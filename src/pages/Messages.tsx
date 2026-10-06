import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Messages() {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const messages = trpc.contact.listMine.useQuery(undefined, { enabled: !!user });
  const markRead = trpc.contact.markRead.useMutation({ onSuccess: () => messages.refetch() });
  if (isLoading || !user) return <main className="min-h-screen bg-cream p-8" />;
  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto max-w-3xl">
    <Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link>
    <h1 className="display-xl mt-10 text-5xl text-forest">Nachrichten</h1>
    <div className="mt-8 space-y-4">{messages.data?.map((item) => <article key={item.id} className={`card-offset p-6 ${!item.readAt ? "border-l-4 border-tang" : ""}`} onClick={() => !item.readAt && markRead.mutate({ messageId: item.id })}>
      <div className="flex justify-between gap-3"><h2 className="text-xl font-bold text-forest">{item.subject}</h2><time className="text-xs text-sagedark">{new Date(item.createdAt).toLocaleDateString("de-DE")}</time></div>
      <p className="mt-3 whitespace-pre-wrap text-sagedark">{item.body}</p>
      <p className="mt-4 text-xs text-sagedark">Von {item.sender?.name ?? "Wyfare-Team"}</p>
    </article>)}{messages.data?.length === 0 && <p className="rounded-lg bg-forest/10 p-4 text-sagedark">Noch keine Nachrichten.</p>}</div>
  </div></main>;
}
