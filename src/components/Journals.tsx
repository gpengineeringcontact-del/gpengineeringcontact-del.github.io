import { IconLock, IconPlane } from "./icons";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export function Journals({ onUpgrade }: { onUpgrade: () => void }) {
  const { isAuthenticated, isMember } = useAuth();
  const navigate = useNavigate();
  const openReport = () => {
    if (!isAuthenticated) navigate("/login");
    else if (!isMember) onUpgrade();
  };
  return (
    <section className="mx-auto max-w-3xl">
      <p className="label-caps mb-3 text-tang">Reiseberichte</p>
      <h1 className="display-xl mb-10 text-4xl sm:text-5xl">Geschichten, die bleiben</h1>

      <article className="card-offset overflow-hidden">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&q=80&w=1200"
            alt="Japan"
            className="h-64 w-full border-b-2 border-forest object-cover sm:h-80"
          />
          <span className="absolute left-5 top-5 -rotate-2 border-2 border-forest bg-tang px-3 py-1.5 label-caps text-cream">
            Erfahrungsbericht
          </span>
        </div>
        <div className="p-6 sm:p-10">
          <p className="label-caps mb-4 text-sagedark">Lesezeit: 4 Minuten · Japan</p>
          <h2 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Mein erster Monat in Japan: Kulturschock & Gastfreundschaft
          </h2>
          <p className="mt-5 leading-relaxed text-forest/85">
            <span className="float-left mr-3 font-display text-6xl font-bold leading-[0.8] text-tang">
              D
            </span>
            ie ersten Wochen waren intensiv. Alles ist anders: die Sprache, das Essen,
            die Regeln in der Schule. Aber meine Gastfamilie hat mir extrem geholfen,
            mich einzugewöhnen – vom gemeinsamen Abendessen bis zu den kleinen Ritualen,
            die niemand in einem Reiseführer erklärt …
          </p>

          {/* Conversion-Bridge */}
          <div className="relative mt-10 overflow-hidden border-2 border-forest bg-forest p-6 text-cream sm:p-8">
            <div className="pointer-events-none absolute -right-6 -top-8 rotate-12 opacity-20">
              <IconPlane className="h-32 w-32 text-tang" />
            </div>
            <h3 className="relative flex items-center gap-2.5 font-display text-lg font-bold">
              <IconLock className="h-5 w-5 text-tang" />
              Neugierig, mit wem ich gereist bin?
            </h3>
            <p className="relative mt-3 max-w-md text-sm leading-relaxed text-cream/75">
              Der vollständige Bericht, Organisations-Vergleiche und Recherchetools
              gehören zum Wyfare Zugang.
            </p>
            <button onClick={openReport} className="btn-tang relative mt-6">
              {isMember ? "Bericht vollständig öffnen" : isAuthenticated ? "Für 25 € freischalten" : "Anmelden und weiterlesen"}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
