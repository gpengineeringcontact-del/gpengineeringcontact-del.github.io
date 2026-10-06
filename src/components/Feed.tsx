import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { IconClose, IconHandshake, IconHeart } from "./icons";

export type FeedPost = {
  id: number;
  caption: string;
  country: string;
  locationLabel: string | null;
  createdAt: Date;
  authorName: string;
  authorRole: string | null;
  likeCount: number;
  likedByMe: boolean;
  imageSrc: string | null;
  authorId: number;
};

const ROLE_LABEL: Record<string, string> = {
  planung: "Plant",
  im_ausland: "Im Ausland",
  alumni: "Alumni",
};

const COUNTRY_FILTERS = ["Alle", "USA", "Kanada", "Neuseeland", "Australien"] as const;

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`;
  return new Date(date).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

function PostCard({
  post,
  index,
  onLike,
  onLicense,
  onOpen,
}: {
  post: FeedPost;
  index: number;
  onLike: (postId: number) => void;
  onLicense: (post: FeedPost) => void;
  onOpen: (post: FeedPost) => void;
}) {
  const navigate = useNavigate();
  const rotation = index % 3 === 0 ? "-rotate-[1.6deg]" : index % 3 === 1 ? "rotate-[1.2deg]" : "-rotate-[0.7deg]";

  return (
    <article className={`masonry-item polaroid relative ${rotation}`} onClick={() => onOpen(post)}>
      <span className="tape" aria-hidden />
      {post.imageSrc && (
        <div className="relative overflow-hidden border border-forest/10">
          <img src={post.imageSrc} alt={post.caption} className="w-full object-cover" loading="lazy" />
          <span className="absolute left-3 top-3 -rotate-2 border-2 border-forest bg-cream px-2.5 py-1 label-caps">
            {post.locationLabel ? `${post.locationLabel}, ` : ""}
            {post.country}
          </span>
        </div>
      )}
      <div className="px-1.5 pt-3">
        <p className="font-hand text-[1.35rem] leading-snug text-forest">{post.caption}</p>
        <div className="mt-3 flex items-center justify-between border-t border-forest/10 pt-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest font-display text-[10px] font-bold uppercase text-cream">
              {post.authorName.slice(0, 2)}
            </span>
            <button className="text-left leading-tight" onClick={(event) => { event.stopPropagation(); navigate(`/profil/${post.authorId}`); }}>
              <p className="text-[13px] font-semibold hover:underline">{post.authorName}</p>
              <p className="text-[11px] text-sagedark">
                {post.authorRole ? `${ROLE_LABEL[post.authorRole]} · ` : ""}
                {timeAgo(post.createdAt)}
              </p>
            </button>
          </div>
          <button
            onClick={(event) => { event.stopPropagation(); onLike(post.id); }}
            className={`flex items-center gap-1.5 transition-colors ${
              post.likedByMe ? "text-tang" : "text-sagedark hover:text-tang"
            }`}
            aria-label="Gefällt mir"
          >
            <IconHeart filled={post.likedByMe} className="h-5 w-5" />
            <span className="font-display text-xs font-bold">{post.likeCount}</span>
          </button>
        </div>
        <button
          onClick={(event) => { event.stopPropagation(); onLicense(post); }}
          className="btn-outline mt-3 w-full !py-2 !text-[10px]"
        >
          <IconHandshake className="h-4 w-4" />
          Bildrechte anfragen
        </button>
      </div>
    </article>
  );
}

export function Feed({
  onLicense,
  onUpgrade,
}: {
  onLicense: (post: FeedPost) => void;
  onUpgrade: () => void;
}) {
  const { user, isAuthenticated, isMember } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<(typeof COUNTRY_FILTERS)[number]>("Alle");
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const postsQuery = trpc.forum.listPosts.useQuery();
  const likeMutation = trpc.forum.toggleLike.useMutation({
    onSuccess: () => utils.forum.listPosts.invalidate(),
  });

  const posts = useMemo(() => {
    const all = (postsQuery.data ?? []) as FeedPost[];
    return filter === "Alle" ? all : all.filter((p) => p.country === filter);
  }, [postsQuery.data, filter]);

  const handleLike = (postId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!isMember) {
      onUpgrade();
      return;
    }
    likeMutation.mutate({ postId });
  };

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="label-caps mb-3 text-tang">Journey Globe</p>
          <h1 className="display-xl text-4xl sm:text-5xl">
            Entdecke die Welt – durch die Augen der Community
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-sagedark">
            Live-Einblicke von Austauschschüler:innen rund um den Globus. Keine
            Hochglanz-Prospekte, nur echte Momente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {COUNTRY_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border-2 px-4 py-1.5 label-caps transition-colors ${
                filter === c
                  ? "border-forest bg-forest text-cream"
                  : "border-forest/25 bg-transparent text-forest hover:border-forest"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {postsQuery.isLoading && !postsQuery.isError ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-forest/5" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="card-offset mx-auto max-w-md p-8 text-center">
          <p className="font-hand text-2xl">Noch keine Beiträge für {filter}.</p>
          <p className="mt-2 text-sm text-sagedark">Sei die oder der Erste und teile deinen Moment.</p>
        </div>
      ) : (
        <div className="masonry">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              onLike={handleLike}
              onLicense={onLicense}
              onOpen={setSelectedPost}
            />
          ))}
        </div>
      )}
      {selectedPost && <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} isMember={isMember} isOwner={isAuthenticated && user?.id === selectedPost.authorId} onChanged={() => { setSelectedPost(null); utils.forum.listPosts.invalidate(); }} />}
    </section>
  );
}

function PostDetail({ post, onClose, isMember, isOwner, onChanged }: { post: FeedPost; onClose: () => void; isMember: boolean; isOwner: boolean; onChanged: () => void }) {
  const navigate = useNavigate();
  const comments = trpc.forum.listComments.useQuery({ postId: post.id });
  const add = trpc.forum.addComment.useMutation({ onSuccess: () => { setText(""); comments.refetch(); } });
    const update = trpc.forum.updatePost.useMutation({ onSuccess: onChanged });
  const remove = trpc.forum.deleteOwnPost.useMutation({ onSuccess: onChanged });
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 p-4" onClick={onClose}><div className="card-offset max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="label-caps text-sagedark">{post.country}{post.locationLabel ? ` · ${post.locationLabel}` : ""}</p><button className="mt-2 text-left font-display text-3xl font-bold text-forest hover:underline" onClick={() => navigate(`/profil/${post.authorId}`)}>{post.authorName}</button></div><div className="flex gap-2">{isOwner && <><button className="btn-outline !px-3 !py-2" onClick={() => { const caption = window.prompt("Text bearbeiten", post.caption);       if (caption?.trim()) update.mutate({ postId: post.id, caption, country: "Anderes Land" });    }}>Bearbeiten</button><button className="btn-outline !px-3 !py-2 !text-red-700" onClick={() => { if (window.confirm("Beitrag löschen?")) remove.mutate({ postId: post.id }); }}>Löschen</button></>}<button onClick={onClose} aria-label="Schließen"><IconClose /></button></div></div>{post.imageSrc && <img src={post.imageSrc} alt="" className="mt-5 max-h-[26rem] w-full rounded-2xl object-cover" />}<p className={`mt-5 whitespace-pre-wrap text-base leading-relaxed text-forest ${expanded ? "" : "line-clamp-5"}`}>{post.caption}</p>{post.caption.length > 260 && <button className="mt-2 text-sm font-bold text-forest underline" onClick={() => setExpanded((value) => !value)}>{expanded ? "Weniger anzeigen" : "Mehr anzeigen"}</button>}<h3 className="mt-8 font-display text-xl font-bold text-forest">Kommentare</h3><div className="mt-3 space-y-3">{comments.data?.map((comment) => <div key={comment.id} className="rounded-xl bg-cream p-3"><b className="text-sm">{comment.authorName}</b><p className="mt-1 text-sm">{comment.body}</p></div>)}</div>{isMember && <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (text.trim()) add.mutate({ postId: post.id, body: text }); }}><input className="input-line" placeholder="Kommentar schreiben …" value={text} onChange={(event) => setText(event.target.value)} /><button className="btn-tang">Senden</button></form>}</div></div>;
}
