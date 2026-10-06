# Wyfare – Forum und Plattform-Fundament

Wyfare ist eine Beratung- und Vergleichsplattform für Auslandsjahr-Agenturen.
Das Forum ist der erste auslieferbare Baustein. Feed und öffentliche
Beitragsvorschauen sind ohne Konto lesbar. Der kostenlose Account schaltet
Q&A frei. Der einmalige Wyfare-Zugang für 25 € schaltet Community-Interaktion,
Reiseberichte und die späteren Recherche-, Vergleichs- und RAG-Funktionen frei.

## 1. Lokal starten

Voraussetzungen: Node.js 20+, npm und eine PostgreSQL-Datenbank (für dein Supabase-Projekt).

```bash
cd "/Users/guidoperetti/Wyfare/app"
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Die Vorschau läuft standardmäßig unter `http://127.0.0.1:3000`.

Vor einem Commit prüfen:

```bash
npm run check
npm run build
```

## 2. Umgebungsvariablen

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
SESSION_SECRET=<mindestens 48 zufällige Bytes>
APP_URL=https://www.wyfare.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NODE_ENV=development
RESEND_API_KEY=
MAIL_FROM=Wyfare <noreply@deine-domain.de>
VITE_GOOGLE_AUTH_URL=https://DEINE-DOMAIN/api/auth/oauth/google
VITE_APPLE_AUTH_URL=https://DEINE-DOMAIN/api/auth/oauth/apple
```

Secret erzeugen:

```bash
openssl rand -base64 48
```

`.env` niemals committen oder im Frontend verwenden. Nur Variablen mit
`VITE_` werden in den Browser eingebaut; Provider-Client-Secrets bleiben
ausschließlich serverseitig.

Der einmalige Wyfare-Zugang wird über `POST /api/stripe/checkout` bezahlt.
Stripe ruft nach erfolgreicher Zahlung `POST /api/stripe/webhook` auf. Der
signaturgeprüfte Webhook setzt das Konto serverseitig auf
`membershipStatus=active`. `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET`
gehören ausschließlich in Vercel bzw. die lokale `.env`.

## 3. Datenbank und Migrationen

Das Schema liegt in `db/schema.ts`. Es enthält unter anderem:

- Benutzer, Passwort-Hash und Session-relevante Kontodaten
- `membershipStatus` und `membershipPlan`
- Feed-Posts und Likes
- Q&A-Threads und Antworten
- Bildrechte-Anfragen
- Kontaktanfragen
- Passwort-Reset-Tokens und Moderationsmeldungen
- Transaktionsmails über Resend für Registrierung, Passwort-Reset und
  bestätigte Wyfare-Zahlungen

Für lokale Entwicklung:

```bash
npm run db:push
```

Für Produktion:

```bash
npm run db:generate
npm run db:migrate
```

Nach Schemaänderungen zuerst eine Migration erzeugen, prüfen und erst danach
auf die Produktionsdatenbank anwenden. Vor Migrationen ein Backup erstellen.

## 4. Authentifizierung

E-Mail-Registrierung und Login laufen über `api/auth-router.ts`. Passwörter
werden mit Node `scrypt` gehasht. Die signierte HttpOnly-Session heißt
`wyfare_sid` und wird serverseitig geprüft.

Google und Apple:

1. In Google Cloud Console und Apple Developer jeweils eine OAuth-App anlegen.
2. Als Callback registrieren:
   `https://DEINE-DOMAIN/api/auth/oauth/callback`
3. Server-Routen implementieren, die `state` und `nonce` erzeugen und prüfen.
4. Authorization Code serverseitig gegen Tokens tauschen.
5. Provider-Identität mit einem Wyfare-Benutzer verknüpfen oder diesen anlegen.
6. Danach `wyfare_sid` setzen und zur Startseite weiterleiten.
7. Die öffentlichen Start-URLs in `VITE_GOOGLE_AUTH_URL` und
   `VITE_APPLE_AUTH_URL` eintragen.

Client-Secrets dürfen niemals in `VITE_`-Variablen stehen.

## 5. Kostenloser und kostenpflichtiger Zugang

Der gewünschte Produktfluss:

| Zugang | Funktionen |
| --- | --- |
| Ohne Konto | Feed und öffentliche Vorschauen lesen |
| Kostenloses Konto | zusätzlich allgemeine Q&A-Fragen stellen und beantworten |
| Wyfare Zugang, einmalig 25 € | posten, liken, interagieren, Berichte, Recherche, Vergleich und später RAG-Berater |

Aktuell ist der Plan beim Registrieren auswählbar. Die Zahlung ist noch nicht
angeschlossen. Für den Livebetrieb:

1. Stripe-Produkt mit einmaligem Preis von 25 € anlegen.
2. Serverseitige Checkout-Session erzeugen.
3. Webhook-Endpunkt für `checkout.session.completed` implementieren.
4. Webhook-Signatur mit `STRIPE_WEBHOOK_SECRET` prüfen.
5. Nur nach erfolgreicher, verifizierter Zahlung
   `membershipStatus = "active"` setzen.
6. Bei Rückerstattung oder Chargeback den Status wieder sperren.
7. Premium-Mutationen serverseitig geschützt lassen; UI-Sperren allein reichen
   nicht.

Stripe bleibt für die aktuelle Beta ausdrücklich im Sandbox-Modus. Verwende
dafür weiterhin `sk_test_...` und den passenden `whsec_...`-Webhook-Schlüssel.

Resend verwendet dieselbe `MAIL_FROM`-Adresse für:

- die Registrierungsbestätigung,
- den Passwort-Reset,
- die Bestätigung des einmaligen 25-€-Zugangs nach erfolgreicher
  Stripe-Webhooksignaturprüfung.

Empfohlene zusätzliche Variablen:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

## 6. Cloud, Bilder und Hosting

Für den Pitch kann die bestehende Data-URL-Speicherung verwendet werden. Für
Produktion sollte sie durch S3-kompatiblen Storage ersetzt werden, zum Beispiel
Cloudflare R2, AWS S3 oder Supabase Storage:

1. Browser lädt das Bild über eine serverseitig erzeugte Presigned URL hoch.
2. Server prüft Dateityp, Größe und Benutzerberechtigung.
3. In MySQL wird nur der Storage-Key gespeichert.
4. Öffentliche URLs werden über CDN oder signierte URLs ausgeliefert.
5. Niemals AWS-/R2-Schlüssel in den Browser geben.

Geeignete Hosting-Optionen sind Railway, Render, Fly.io oder eine eigene
Node-Instanz. Produktionsvariablen dort hinterlegen, nicht in Git.

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

Domain, HTTPS, Backups, Fehler-Monitoring und Rate-Limits vor dem Livegang
einrichten.

## 7. Zukünftige Module

Die Erweiterung sollte als getrennte Module/Routers angebunden werden:

- `agencies`: Agenturprofile, Kriterien, Preise und Bewertungen
- `research`: Quellen, Rechercheaufträge und gespeicherte Ergebnisse
- `advisor`: RAG-Index, Quellenverwaltung, Chat und Gesprächshistorie
- `billing`: Checkout, Webhooks, Rechnungen und Zugriffsstatus
- `admin`: Moderation, Agenturverwaltung und Kontaktanfragen

Gemeinsam bleiben Benutzerkonto, Session, Mitgliedschaftsstatus und
Berechtigungs-Middleware. Das Forum muss dadurch nicht umgebaut werden.

## 8. Sicherheits- und Datenschutz-Checkliste

- Passwörter nie im Klartext speichern.
- OAuth `state`, `nonce` und Callback-Codes serverseitig validieren.
- Stripe-Webhooks immer anhand der Signatur prüfen.
- Eingaben mit Zod validieren und serverseitig autorisieren.
- Passwort-Reset-Links sind gehasht gespeichert, nach 30 Minuten ungültig und
  nur einmal verwendbar.
- `RESEND_API_KEY` und `MAIL_FROM` werden für den echten Reset-Mailversand
  benötigt; ohne diese Konfiguration meldet die API den fehlenden Dienst
  ausdrücklich.
- Kontodaten können über die Auth-API exportiert und pseudonymisiert gelöscht
  werden. Moderations- und Admin-Aktionen sind serverseitig rollenbeschränkt.
- Rate-Limits für Login, Upload, Kontakt und Chat einrichten.
- Uploads auf Größe, MIME-Type und Inhalt prüfen.
- Datenbank-Backups und Löschkonzept festlegen.
- Impressum und Datenschutz mit tatsächlichen Hosting- und Zahlungsanbietern
  aktualisieren.
- Logs von Passwörtern, Tokens und persönlichen Nachrichten bereinigen.
