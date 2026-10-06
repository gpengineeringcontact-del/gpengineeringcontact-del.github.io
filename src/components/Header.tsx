import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { BrandMark } from "./BrandMark";
import { trpc } from "@/providers/trpc";

const ROLE_LABEL: Record<string, string> = {
  planung: "Plant das Auslandsjahr",
  im_ausland: "Gerade im Ausland",
  alumni: "Alumni",
};

export function Header({ onOpenUpload }: { onOpenUpload: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();
  const unread = trpc.contact.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5000 });

  return (
    <>
      <div className="h-3 border-b border-forest/10 bg-forest" aria-hidden="true" />

      {/* Kopfzeile */}
      <header className="sticky top-0 z-40 border-b border-forest/15 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/"><BrandMark /></Link>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <button onClick={onOpenUpload} className="btn-tang hidden sm:inline-flex">
                  Beitrag teilen
                </button>
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-forest/15 bg-paper py-1 pl-1 pr-2 sm:gap-2.5 sm:pr-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest font-display text-xs font-bold uppercase text-cream">
                    {(user.name ?? "?").slice(0, 2)}
                  </span>
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-28 truncate text-sm font-semibold leading-tight">
                      {user.name ?? "Mitglied"}
                    </span>
                    <span className="block text-[11px] leading-tight text-sagedark">
                      {user.exchangeRole ? ROLE_LABEL[user.exchangeRole] : "Neu hier"}
                    </span>
                  </span>
                  <button
                    onClick={() => logout()}
                    className="ml-1 shrink-0 text-[11px] font-semibold text-sagedark transition-colors hover:text-tang"
                    title="Abmelden"
                  >
                    Abmelden
                  </button>
                  <Link to="/konto" className="ml-1 shrink-0 text-[11px] font-semibold text-sagedark transition-colors hover:text-tang">
                    Konto
                  </Link>
                  <Link to="/nachrichten" className="ml-1 shrink-0 text-[11px] font-semibold text-sagedark transition-colors hover:text-tang">
                    Nachrichten{(unread.data?.count ?? 0) > 0 && <span className="ml-1 inline-flex min-w-4 justify-center rounded-full bg-tang px-1 text-[10px] text-forest">{unread.data?.count}</span>}
                  </Link>
                  {user.role === "admin" && <Link to="/admin" className="ml-1 shrink-0 text-[11px] font-semibold text-sagedark transition-colors hover:text-tang">
                    Admin
                  </Link>}
                </div>
              </>
            ) : (
              <Link to="/login" className="btn-tang">
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
