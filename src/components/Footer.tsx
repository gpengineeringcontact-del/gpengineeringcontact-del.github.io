import { Link } from "react-router";
import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-forest bg-forest text-cream">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandMark darkSurface />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
              Die Community für dein Auslandsjahr. Echte Erfahrungen, ehrliche
              Antworten, faire Bildrechte.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-cream/65">
            <Link to="/ueber-uns" className="hover:text-cream">Über uns</Link>
            <Link to="/kontakt" className="hover:text-cream">Kontakt</Link>
            <Link to="/impressum" className="hover:text-cream">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-cream">Datenschutz</Link>
          </div>
        </div>
        <div className="mt-14 flex justify-center opacity-20" aria-hidden>
          <BrandMark darkSurface />
        </div>
        <p className="mt-6 border-t border-cream/15 pt-5 text-[11px] text-cream/50">
          © {new Date().getFullYear()} Wyfare. Gebaut von Austauschschüler:innen, für Austauschschüler:innen.
        </p>
      </div>
    </footer>
  );
}
