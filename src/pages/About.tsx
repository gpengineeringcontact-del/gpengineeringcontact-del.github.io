import { Link } from "react-router";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function About() {
  return <div className="min-h-screen"><Header onOpenUpload={() => undefined} /><main className="mx-auto max-w-5xl px-5 py-16 sm:px-6">
    <p className="label-caps mb-4 text-tang">Über Wyfare</p>
    <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <div><h1 className="display-xl text-5xl sm:text-7xl">Warum es Wyfare gibt.</h1><p className="mt-6 text-lg leading-relaxed text-sagedark">Hinter Wyfare stehen Christoph Ebsen und Guido Peretti – mit eigenen Erfahrungen aus England und Australien und der Idee, Orientierung rund um das Auslandsjahr persönlicher zu machen.</p><Link to="/" className="btn-tang mt-8">Zur Community</Link></div>
      <div className="overflow-hidden rounded-2xl bg-forest/10"><img src="/assets/christoph-guido.jpeg" alt="Christoph und Guido von Wyfare" className="aspect-[4/3] w-full object-cover" /></div>
    </div>
    <div className="mt-20 grid gap-8 border-t border-forest/15 pt-10 sm:grid-cols-2"><div><h2 className="font-display text-xl font-bold">Unsere Geschichte</h2><p className="mt-2 text-sm leading-relaxed text-sagedark">Wyfare ist eine von uns ins Leben gerufene Agentur, die dir dabei hilft, Auslandsorganisationen und deren Angebote zu vergleichen. Während unserer Aufenthalte in England und Australien haben wir viele Erfahrungen mit falschen Versprechen und Vorstellungen gemacht. Genau da wollen wir helfen.</p><p className="mt-3 text-sm leading-relaxed text-sagedark">Durch Erfahrungen, Kontakte vor Ort und umfangreiche Recherche helfen wir dir, das Beste aus deiner Auslandsjahrerfahrung herauszuholen.</p></div><div><h2 className="font-display text-xl font-bold">Was uns wichtig ist</h2><p className="mt-2 text-sm leading-relaxed text-sagedark">Wir sind keine Agentur, die dich ins Ausland schickt. Unser Anspruch ist ein anderer: Informationen verständlich machen, Erfahrungen teilen und dir helfen, die für dich relevanten Fragen zu beantworten, damit du das bestmögliche Angebot für dich findest.</p></div></div>
  </main><Footer /></div>;
}
