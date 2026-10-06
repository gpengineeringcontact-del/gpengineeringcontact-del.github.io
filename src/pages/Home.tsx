import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DockNav, TabBar, type TabId } from "@/components/DockNav";
import { Feed, type FeedPost } from "@/components/Feed";
import { Journals } from "@/components/Journals";
import { QA } from "@/components/QA";
import { IconPlane, IconCompass, StickerBadge } from "@/components/icons";
import {
  B2BDialog,
  RoleDialog,
  UpgradeDialog,
  UploadDialog,
} from "@/components/dialogs";

export default function Home() {
  const [tab, setTab] = useState<TabId>("feed");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [licensePost, setLicensePost] = useState<FeedPost | null>(null);
  const [roleDismissed, setRoleDismissed] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<number | null>(null);

  const { user, isAuthenticated, isMember, isLoading } = useAuth();
  const navigate = useNavigate();
  const communityQuestions = trpc.forum.listThreads.useQuery(undefined, { staleTime: 15000 });

  const openUpload = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!isMember) {
      setUpgradeOpen(true);
      return;
    }
    setUploadOpen(true);
  };

  const showRoleDialog =
    isAuthenticated && !isLoading && user && !user.exchangeRole && !roleDismissed;

  return (
    <div className="min-h-screen pb-28 sm:pb-0">
      <Header onOpenUpload={openUpload} />

      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <section className="relative mb-12 overflow-hidden rounded-[2rem] bg-forest px-6 py-10 text-cream sm:px-10 sm:py-14">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-tang/20" />
          <div className="absolute bottom-[-80px] right-24 h-44 w-44 rounded-full border-[18px] border-cream/10" />
          <div className="relative max-w-2xl">
            <p className="label-caps mb-5 text-tang">Ein echtes Zuhause für unterwegs</p>
            <h1 className="display-xl text-4xl sm:text-6xl">Nicht nur weg. Wirklich ankommen.</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg">
              Wyfare ist der Ort für die kleinen Geschichten zwischen Abschied und
              Ankommen: ehrliche Erfahrungen, Fragen ohne Filter und Menschen, die
              genau wissen, wie sich dein Auslandsjahr anfühlt.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button onClick={openUpload} className="btn-tang">
                Deinen Moment teilen <IconPlane className="h-4 w-4" />
              </button>
              <span className="flex items-center gap-2 text-sm text-cream/60">
                <IconCompass className="h-4 w-4 text-tang" /> Von Austauschschüler:innen für Austauschschüler:innen
              </span>
            </div>
          </div>
        </section>
        <TabBar active={tab} onChange={setTab} />
        <section className="mb-10 mt-6 grid gap-4 border-y border-forest/10 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="label-caps text-tang">Das Wyfare-Ökosystem</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sagedark">
              Heute: echte Erfahrungen aus der Community. Als nächstes: der
              unabhängige Agenturvergleich und ein persönlicher RAG-Berater –
              für Mitglieder mit einmaligem Wyfare Zugang.
            </p>
          </div>
          <span className="label-caps rounded-full border border-forest/15 px-3 py-2 text-forest">Forum · Phase 1</span>
        </section>
        <section className="mb-10 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="label-caps text-tang">Gerade in der Community</p>
            <h2 className="display-xl mt-2 text-3xl text-forest">Offene Fragen</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-sagedark">Echte Fragen aus dem Forum – lies mit, teile deine Erfahrung und hilf jemandem beim Ankommen.</p>
            <button className="btn-outline mt-5" onClick={() => setTab("qa")}>Alle Fragen ansehen</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {communityQuestions.data?.slice(0, 4).map((thread) => (
              <button key={thread.id} className="card-offset-sm p-4 text-left transition-transform hover:-translate-y-1" onClick={() => { setOpenThreadId(thread.id); setTab("qa"); }}>
                <p className="font-display text-base font-bold leading-snug text-forest">{thread.title}</p>
                <p className="mt-3 text-xs text-sagedark">{thread.replyCount} {thread.replyCount === 1 ? "Antwort" : "Antworten"} · von {thread.authorName}</p>
              </button>
            ))}
            {!communityQuestions.isLoading && !communityQuestions.data?.length && <div className="card-offset-sm p-5 text-sm text-sagedark sm:col-span-2">Noch keine offenen Fragen. Stell die erste Frage im Q&A.</div>}
          </div>
        </section>

        {tab === "feed" && (
          <div className="relative">
            <div className="pointer-events-none absolute -top-6 right-0 hidden w-28 rotate-12 lg:block">
              <StickerBadge />
            </div>
            <Feed onLicense={setLicensePost} onUpgrade={() => setUpgradeOpen(true)} />
          </div>
        )}
        {tab === "berichte" && <Journals onUpgrade={() => setUpgradeOpen(true)} />}
        {tab === "qa" && <QA initialThreadId={openThreadId} onUpgrade={() => setUpgradeOpen(true)} />}
      </main>

      <Footer />

      <DockNav active={tab} onChange={setTab} onOpenUpload={openUpload} />

      {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} />}
      {licensePost && (
        <B2BDialog postId={licensePost.id} onClose={() => setLicensePost(null)} />
      )}
      {upgradeOpen && <UpgradeDialog onClose={() => setUpgradeOpen(false)} />}
      {showRoleDialog && <RoleDialog onClose={() => setRoleDismissed(true)} />}
    </div>
  );
}
