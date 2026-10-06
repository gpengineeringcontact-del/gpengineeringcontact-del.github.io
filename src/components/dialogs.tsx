import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { IconClose } from "./icons";

const COUNTRIES = [
  "USA",
  "Kanada",
  "Neuseeland",
  "Großbritannien",
  "Irland",
  "Australien",
  "Japan",
  "Spanien",
  "Frankreich",
  "Anderes Land",
] as const;

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 p-4"
      onClick={onClose}
    >
      <div
        className="card-offset max-h-[88vh] w-full max-w-md overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Schließen">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Upload
export function UploadDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [caption, setCaption] = useState("");
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>("USA");
  const [locationLabel, setLocationLabel] = useState("");
  const [image, setImage] = useState<{ base64: string; name: string; preview: string } | null>(null);
  const [error, setError] = useState("");

  const createPost = trpc.forum.createPost.useMutation({
    onSuccess: () => {
      utils.forum.listPosts.invalidate();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const handleFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      setError("Das Bild darf maximal 4 MB groß sein.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImage({
        base64: result.split(",")[1],
        name: file.name,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <ModalShell title="Moment teilen" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({
            caption,
            country,
            locationLabel: locationLabel || undefined,
            imageBase64: image?.base64,
            imageName: image?.name,
          });
        }}
      >
        <label className="label-caps mb-1 block text-sagedark">Foto</label>
        <label className="mb-4 block cursor-pointer border-2 border-dashed border-forest/30 p-5 text-center transition-colors hover:border-tang">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {image ? (
            <img src={image.preview} alt="Vorschau" className="mx-auto max-h-40 object-cover" />
          ) : (
            <span className="text-sm text-sagedark">
              Klicken, um ein Bild auszuwählen (max. 4 MB)
            </span>
          )}
        </label>

        <label className="label-caps mb-1 block text-sagedark">Dein Text</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          required
          minLength={3}
          placeholder="Was ist passiert?"
          className="input-line mb-4 resize-none"
        />

        <label className="label-caps mb-1 block text-sagedark">Ort (optional)</label>
        <input
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder="z. B. British Columbia"
          className="input-line mb-4"
        />

        <label className="label-caps mb-1 block text-sagedark">Land</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value as (typeof COUNTRIES)[number])}
          className="input-line mb-6"
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {error && <p className="mb-3 text-sm font-medium text-tang-dark">{error}</p>}
        <button type="submit" className="btn-tang w-full" disabled={createPost.isPending}>
          {createPost.isPending ? "Wird hochgeladen …" : "Jetzt posten"}
        </button>
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------- B2B
export function B2BDialog({
  postId,
  onClose,
}: {
  postId: number;
  onClose: () => void;
}) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const request = trpc.forum.requestLicense.useMutation({
    onSuccess: () => setDone(true),
  });

  return (
    <ModalShell title="Bildrechte anfragen" onClose={onClose}>
      {done ? (
        <div className="py-4 text-center">
          <p className="font-hand text-3xl">Anfrage ist raus!</p>
          <p className="mt-3 text-sm text-sagedark">
            Wir melden uns bei dir, sobald die Ersteller:in geantwortet hat.
          </p>
          <button onClick={onClose} className="btn-outline mt-6">
            Schließen
          </button>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm leading-relaxed text-forest/80">
            <strong>Für Organisationen & Agenturen:</strong> Dieses Material stammt von
            einem:einer Wyfare-Community-Mitglied. Du kannst die kommerziellen
            Nutzungsrechte anfragen – die Ersteller:in wird fair beteiligt.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              request.mutate({ postId, company, email, message: message || undefined });
            }}
          >
            <label className="label-caps mb-1 block text-sagedark">Organisation</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              minLength={2}
              className="input-line mb-4"
            />
            <label className="label-caps mb-1 block text-sagedark">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-line mb-4"
            />
            <label className="label-caps mb-1 block text-sagedark">Nutzungszweck (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="input-line mb-5 resize-none"
            />
            <div className="mb-5 flex items-center justify-between border-2 border-forest/15 bg-cream px-4 py-3">
              <span className="text-sm font-medium">Lizenzgebühr (einmalig)</span>
              <span className="font-display text-lg font-bold text-tang">50,00 €</span>
            </div>
            <button type="submit" className="btn-tang w-full" disabled={request.isPending}>
              {request.isPending ? "Wird gesendet …" : "Verbindlich anfragen"}
            </button>
          </form>
        </>
      )}
    </ModalShell>
  );
}

// ---------------------------------------------------------------- Rolle
export function RoleDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const setRole = trpc.forum.setExchangeRole.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      onClose();
    },
  });

  const options = [
    { value: "planung" as const, title: "Ich plane", desc: "Mein Auslandsjahr steht noch bevor." },
    { value: "im_ausland" as const, title: "Ich bin mittendrin", desc: "Ich lebe gerade im Ausland." },
    { value: "alumni" as const, title: "Ich bin zurück", desc: "Und teile gern meine Erfahrung." },
  ];

  return (
    <ModalShell title="Wo stehst du gerade?" onClose={onClose}>
      <p className="mb-5 text-sm text-sagedark">
        Damit die Community weiß, aus welcher Perspektive du schreibst.
      </p>
      <div className="space-y-3">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setRole.mutate({ exchangeRole: o.value })}
            disabled={setRole.isPending}
            className="block w-full border-2 border-forest/15 bg-paper p-4 text-left transition-colors hover:border-forest hover:bg-cream"
          >
            <p className="font-display text-sm font-bold uppercase tracking-wide">{o.title}</p>
            <p className="mt-1 text-sm text-sagedark">{o.desc}</p>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------- Upgrade
export function UpgradeDialog({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Wyfare Zugang" onClose={onClose}>
      <p className="font-hand text-3xl leading-snug">
        Mehr als mitlesen: Community, Vergleich und Beratung an einem Ort.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-forest/80">
        Der Zugang kostet einmalig 25 €. Damit kannst du Beiträge erstellen,
        liken und kommentieren. Später kommen die Vergleichsplattform für
        Auslandsjahr-Agenturen und der persönliche Wyfare-RAG-Berater hinzu.
      </p>
      <a href="/login" className="btn-tang mt-6 w-full">
        Zugang vormerken
      </a>
      <button onClick={onClose} className="mt-3 w-full py-2 text-sm font-medium text-sagedark hover:text-forest">
        Vielleicht später
      </button>
    </ModalShell>
  );
}
