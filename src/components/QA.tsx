import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { IconClose, IconCompass, IconSend } from "./icons";

type ChatMsg = { from: "user" | "bot"; text: string; escalation?: boolean };

const DEMO_THREADS = [
  { id: -1, title: "Wie finde ich Anschluss an der neuen Schule?", body: "Ich bin seit zwei Wochen hier und kenne noch niemanden. Wie habt ihr den ersten Schritt gemacht?", createdAt: new Date(), authorName: "Sophie", replyCount: 7 },
  { id: -2, title: "Was gehört wirklich in den Koffer?", body: "Ich fliege im August nach Kanada und habe das Gefühl, viel zu viel einzupacken.", createdAt: new Date(), authorName: "Ben", replyCount: 12 },
  { id: -3, title: "Wie war das erste Wochenende bei der Gastfamilie?", body: "Gibt es Regeln, die ich direkt am Anfang kennen sollte?", createdAt: new Date(), authorName: "Amelie", replyCount: 4 },
];

const CONCIERGE_ANSWERS: { match: RegExp; text: string }[] = [
  {
    match: /taschengeld|geld|budget|kosten/i,
    text: "Für die USA oder Kanada empfehlen die meisten Alumni etwa 200 bis 300 Euro Taschengeld im Monat – je nachdem, wie viel du unternimmst.",
  },
  {
    match: /visum|visa/i,
    text: "Visumsprozesse dauern oft 4 bis 8 Wochen. Für die USA brauchst du meist das J1- oder F1-Visum. Fang früh mit den Dokumenten an!",
  },
  {
    match: /gastfamilie|host ?family/i,
    text: "Gastfamilien werden von den Organisationen sorgfältig ausgewählt. Wenn es nicht passt, gibt es immer einen Wechsel-Prozess – sprich früh mit deiner Ansprechperson.",
  },
];

const PREMIUM_KEYWORDS = /orga|organisation|beste|tüv|dfh|sicher|agentur|anbieter|bewertung/i;

export function QA({ onUpgrade }: { onUpgrade: () => void }) {
  const { isAuthenticated, isMember } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [openThreadId, setOpenThreadId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [replyText, setReplyText] = useState("");

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      from: "bot",
      text: "Hallo! Ich bin der Wyfare Concierge. Frag mich alles rund ums Auslandsjahr – zum Beispiel zum Taschengeld, zum Visum oder zu Gastfamilien.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const threadsQuery = trpc.forum.listThreads.useQuery();
  const threadQuery = trpc.forum.getThread.useQuery(
    { threadId: openThreadId ?? 0 },
    { enabled: openThreadId !== null && openThreadId > 0 },
  );
  const selectedDemoThread = DEMO_THREADS.find((thread) => thread.id === openThreadId);

  const createThread = trpc.forum.createThread.useMutation({
    onSuccess: () => {
      utils.forum.listThreads.invalidate();
      setNewTitle("");
      setNewBody("");
      setShowNewThread(false);
    },
  });
  const reply = trpc.forum.replyToThread.useMutation({
    onSuccess: () => {
      if (openThreadId) threadQuery.refetch();
      utils.forum.listThreads.invalidate();
      setReplyText("");
    },
  });

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    if (!isMember) {
      onUpgrade();
      return false;
    }
    return true;
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const text = chatInput.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setChatInput("");
    window.setTimeout(() => {
      if (PREMIUM_KEYWORDS.test(text) && !isMember) {
        setMessages((m) => [
          ...m,
          {
            from: "bot",
            escalation: true,
            text: "Konkrete Einschätzungen zu Organisationen, Agenturen und Qualitätsstandards gehören zum Wyfare Zugang für einmalig 25 €. Mit einem kostenlosen Account kannst du hier allgemeine Fragen rund ums Auslandsjahr stellen.",
          },
        ]);
        return;
      }
      const hit = CONCIERGE_ANSWERS.find((a) => a.match.test(text));
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text:
            hit?.text ??
            "Spannende Frage! Schau am besten auch in die Q&A-Threads links – dort teilt die Community ihre Erfahrungen. Oder stell deine Frage direkt als neuen Thread.",
        },
      ]);
    }, 600);
  };

  return (
    <section>
      <div className="mb-8">
        <p className="label-caps mb-3 text-tang">Q&A</p>
        <h1 className="display-xl text-4xl sm:text-5xl">Frag die Community</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Threads */}
        <div className="lg:col-span-2">
          <div className="card-offset p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                Offene Fragen
              </h2>
              <button
                onClick={() => (requireAuth() ? setShowNewThread(true) : null)}
                className="label-caps text-tang hover:text-tang-dark"
              >
                + Neue Frage
              </button>
            </div>

            {showNewThread && (
              <form
                className="mb-5 border-2 border-dashed border-forest/30 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createThread.mutate({ title: newTitle, body: newBody || undefined });
                }}
              >
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Deine Frage in einem Satz …"
                  className="input-line mb-3"
                  required
                  minLength={5}
                />
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Mehr Kontext (optional)"
                  rows={2}
                  className="input-line mb-3 resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-tang !py-2" disabled={createThread.isPending}>
                    Fragen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewThread(false)}
                    className="btn-outline !py-2"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            )}

            <div className="scroll-slim max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
              {(threadsQuery.data?.length ? threadsQuery.data : DEMO_THREADS).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpenThreadId(t.id)}
                  className={`block w-full border-2 p-4 text-left transition-colors ${
                    openThreadId === t.id
                      ? "border-forest bg-forest text-cream"
                      : "border-forest/15 bg-paper hover:border-forest"
                  }`}
                >
                  <p className="text-sm font-semibold leading-snug">{t.title}</p>
                  <p
                    className={`mt-1.5 text-[11px] ${
                      openThreadId === t.id ? "text-cream/70" : "text-sagedark"
                    }`}
                  >
                    {t.replyCount} {t.replyCount === 1 ? "Antwort" : "Antworten"} · von{" "}
                    {t.authorName}
                  </p>
                </button>
              ))}
              {!threadsQuery.isLoading && !threadsQuery.data?.length && (
                <p className="mt-3 text-center text-[11px] text-sagedark">Demo-Fragen – melde dich an, um mitzuschreiben.</p>
              )}
            </div>
          </div>
        </div>

        {/* Concierge */}
        <div className="card-offset flex flex-col overflow-hidden lg:col-span-3">
          <div className="flex items-center gap-3 border-b-2 border-forest bg-forest px-5 py-4 text-cream">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tang">
              <IconCompass className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.15em]">
                Wyfare Concierge
              </h3>
              <p className="text-[11px] text-cream/70">
                Beantwortet Fragen aus Community-Erfahrungen
              </p>
            </div>
          </div>

          <div className="scroll-slim flex-1 space-y-4 overflow-y-auto bg-cream p-5" style={{ minHeight: 320, maxHeight: 460 }}>
            {messages.map((m, i) =>
              m.from === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] border-2 border-forest bg-forest px-4 py-3 text-sm text-cream">
                    {m.text}
                  </div>
                </div>
              ) : m.escalation ? (
                <div key={i} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tang text-cream">
                    <IconCompass className="h-4 w-4" />
                  </span>
                  <div className="max-w-[80%] border-2 border-tang bg-paper px-4 py-3">
                    <p className="text-sm text-forest">{m.text}</p>
                    <button onClick={onUpgrade} className="btn-tang mt-3 !py-2 !text-[10px]">
                      Wyfare Zugang für 25 € öffnen
                    </button>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tang text-cream">
                    <IconCompass className="h-4 w-4" />
                  </span>
                  <div className="max-w-[80%] border-2 border-forest/15 bg-paper px-4 py-3 text-sm text-forest">
                    {m.text}
                  </div>
                </div>
              ),
            )}
          </div>

          <form onSubmit={handleChat} className="flex gap-2 border-t-2 border-forest bg-paper p-4">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isAuthenticated ? "Stelle eine Frage …" : "Kostenloses Konto zum Fragenstellen"}
              className="input-line flex-1 !border-forest/40"
            />
            <button type="submit" className="btn-tang !px-5" aria-label="Senden">
              <IconSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Thread-Detail Dialog */}
      {openThreadId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 p-4"
          onClick={() => setOpenThreadId(null)}
        >
          <div
            className="card-offset max-h-[85vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="font-display text-xl font-bold leading-snug">
                {threadQuery.data?.title ?? selectedDemoThread?.title ?? "Frage"}
              </h3>
              <button onClick={() => setOpenThreadId(null)} aria-label="Schließen">
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            {(threadQuery.data?.body ?? selectedDemoThread?.body) && (
              <p className="mb-2 text-sm leading-relaxed text-forest/85">
                {threadQuery.data?.body ?? selectedDemoThread?.body}
              </p>
            )}
            <p className="label-caps text-sagedark">von {threadQuery.data?.authorName ?? selectedDemoThread?.authorName}</p>

            <div className="mt-6 space-y-4 border-t-2 border-forest/10 pt-5">
              {(threadQuery.data?.replies ?? []).map((r) => (
                <div key={r.id} className="border-l-[3px] border-tang pl-4">
                  <p className="text-sm leading-relaxed">{r.content}</p>
                  <p className="mt-1 text-[11px] text-sagedark">{r.authorName}</p>
                </div>
              ))}
              {!threadQuery.data && (
                <p className="text-sm text-sagedark">Noch keine Antworten.</p>
              )}
            </div>

            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!requireAuth() || !openThreadId) return;
                reply.mutate({ threadId: openThreadId, content: replyText });
              }}
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isAuthenticated ? "Deine Antwort …" : "Zum Antworten anmelden"}
                rows={2}
                className="input-line resize-none"
                required
                minLength={2}
              />
              <button type="submit" className="btn-tang mt-3 !py-2" disabled={reply.isPending}>
                Antworten
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
