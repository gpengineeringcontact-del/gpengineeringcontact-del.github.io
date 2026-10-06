import { Link } from "react-router";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function Imprint() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        PerettiEbsen GbR<br />
        Markenauftritt: Wyfare<br />
        Simonsweg 45<br />
        41464 Neuss
      </p>
      <h3>Vertreten durch die Gesellschafter</h3>
      <p>Guido Peretti und Christoph Ebsen</p>
      <h3>Kontakt</h3>
      <p>
        Telefon: +49 176 98758208<br />
        E-Mail: contact@wyfare.com
      </p>
      <h3>Redaktionell verantwortlich</h3>
      <p>
        Guido Peretti und Christoph Ebsen<br />
        Simonsweg 45<br />
        41464 Neuss
      </p>
      <h3>EU-Streitschlichtung</h3>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-
        Streitbeilegung (OS) bereit. Unsere E-Mail-Adresse findest du oben im
        Impressum.
      </p>
      <h3>Verbraucherstreitbeilegung</h3>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
      <h2>Urheberrecht und Haftungshinweise</h2>
      <h3>Urheberrecht</h3>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte, Werke und Aufnahmen,
        insbesondere das Bild- und Fotomaterial, unterliegen dem deutschen
        Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art
        der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der
        schriftlichen Zustimmung des jeweiligen Autors oder Erstellers.
      </p>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p>
        Informationen zum Schutz deiner personenbezogenen Daten auf unserer
        Website.
      </p>
      <h2>1. Datenschutz auf einen Blick</h2>
      <h3>Allgemeine Hinweise</h3>
      <p>
        Personenbezogene Daten sind alle Daten, mit denen du persönlich
        identifiziert werden kannst. Wir behandeln diese Daten vertraulich und
        entsprechend den gesetzlichen Datenschutzvorschriften.
      </p>
      <h3>Verantwortliche Stelle</h3>
      <p>
        PerettiEbsen GbR (Markenauftritt: Wyfare)<br />
        Guido Peretti und Christoph Ebsen<br />
        Simonsweg 45, 41464 Neuss<br />
        Telefon: +49 176 98758208<br />
        E-Mail: contact@wyfare.com
      </p>
      <h3>Wie erfassen wir Daten?</h3>
      <p>
        Daten werden erhoben, wenn du sie selbst mitteilst, zum Beispiel im
        Kontaktformular oder bei der Registrierung. Weitere technische Daten
        wie Browser, Betriebssystem, Zugriffszeit und IP-Adresse können beim
        Besuch automatisch durch unsere IT-Systeme verarbeitet werden.
      </p>
      <h3>Wofür nutzen wir Daten?</h3>
      <p>
        Wir nutzen Daten zur Bereitstellung und Absicherung der Website, zur
        Verwaltung von Konten und Beiträgen sowie zur Bearbeitung deiner
        Anfragen. Eine Weitergabe erfolgt nur, wenn sie zur Vertragserfüllung
        erforderlich, gesetzlich vorgeschrieben, eingewilligt oder auf einer
        zulässigen Interessenabwägung beruht.
      </p>
      <h2>2. Hosting und Cloud</h2>
      <p>
        Für Hosting, Datenbank und Cloud-Dienste können externe Dienstleister
        eingesetzt werden. Dabei verarbeiten diese Anbieter technische
        Zugriffsdaten und – soweit für den Betrieb erforderlich – die in Wyfare
        gespeicherten Daten. Wir schließen die erforderlichen
        Auftragsverarbeitungsverträge und wählen Anbieter mit angemessenen
        Sicherheitsmaßnahmen.
      </p>
      <h2>3. Kontaktformular</h2>
      <p>
        Wenn du uns über das Kontaktformular kontaktierst, speichern wir Name,
        E-Mail-Adresse und Nachricht zur Bearbeitung deiner Anfrage und für
        mögliche Anschlussfragen. Die Daten bleiben gespeichert, bis der Zweck
        entfällt oder du eine Löschung verlangst, soweit keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>
      <h2>4. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
        der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine erteilte
        Einwilligung kannst du jederzeit für die Zukunft widerrufen. Außerdem
        besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
      </p>
      <p>
        Zuständig ist insbesondere die Landesbeauftragte für Datenschutz und
        Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße
        2–4, 40213 Düsseldorf, Telefon 0211/38424-0, E-Mail:
        poststelle@ldi.nrw.de.
      </p>
      <h2>5. Sicherheit und Speicherdauer</h2>
      <p>
        Diese Website nutzt bei aktivierter Serverkonfiguration SSL- bzw.
        TLS-Verschlüsselung. Daten werden nur so lange gespeichert, wie es für
        den jeweiligen Zweck erforderlich ist oder gesetzliche
        Aufbewahrungsfristen bestehen.
      </p>
    </LegalPage>
  );
}

function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header onOpenUpload={() => undefined} />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <p className="label-caps mb-4 text-tang">Wyfare</p>
        <h1 className="display-xl mb-10 text-5xl">{title}</h1>
        <article className="legal-copy max-w-none space-y-6 text-sagedark">
          {children}
        </article>
        <Link to="/" className="btn-outline mt-10">
          Zur Startseite
        </Link>
      </main>
      <Footer />
    </div>
  );
}
