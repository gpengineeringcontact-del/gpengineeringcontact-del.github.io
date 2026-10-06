import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const { user, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const reports = trpc.forum.listReports.useQuery(undefined, { enabled: user?.role === "admin" });
  const resolve = trpc.forum.resolveReport.useMutation({
    onSuccess: () => reports.refetch(),
  });
  const deactivate = trpc.forum.deactivateUser.useMutation({
    onSuccess: () => reports.refetch(),
  });

  if (isLoading) return <main className="min-h-screen bg-cream p-8" />;
  if (!user || user.role !== "admin") {
    return <main className="min-h-screen bg-cream px-5 py-20"><div className="mx-auto max-w-xl card-offset p-8">
      <h1 className="display-xl text-4xl text-forest">Kein Admin-Zugriff</h1>
      <p className="mt-4 text-sagedark">Diese Seite ist nur für Moderationsteams verfügbar.</p>
      <Link className="btn-outline mt-6" to="/">Zurück zu Wyfare</Link>
    </div></main>;
  }

  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link to="/" className="text-sm font-semibold text-forest underline">← Zurück zu Wyfare</Link>
      <h1 className="display-xl mt-10 text-5xl text-forest">Moderation</h1>
      <p className="mt-3 text-sagedark">Offene Meldungen prüfen und Maßnahmen serverseitig ausführen.</p>
      {reports.isLoading && <p className="mt-8 text-sagedark">Meldungen werden geladen …</p>}
      {!reports.isLoading && reports.data?.length === 0 && <p className="mt-8 rounded-lg bg-forest/10 p-4 text-forest">Keine offenen Meldungen.</p>}
      <div className="mt-8 space-y-4">
        {reports.data?.map((report) => <article key={report.id} className="card-offset p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label-caps text-tang">{report.reason}</p>
              <p className="mt-2 text-sm text-sagedark">Gemeldet von {report.reporter?.name ?? "unbekannt"} am {new Date(report.createdAt).toLocaleString("de-DE")}</p>
            </div>
            <span className="rounded-full bg-tang/20 px-3 py-1 text-xs font-bold text-forest">Offen</span>
          </div>
          {report.details && <p className="mt-4 rounded-lg bg-paper p-4 text-sm text-forest">{report.details}</p>}
          {report.post && <p className="mt-4 text-sm text-forest"><strong>Beitrag:</strong> {report.post.caption}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-outline" onClick={() => resolve.mutate({ reportId: report.id })} disabled={resolve.isPending}>Als erledigt markieren</button>
            {report.reporter && <button className="rounded-full border border-red-300 px-5 py-2.5 text-xs font-bold text-red-700" onClick={() => {
              if (window.confirm(`Konto von ${report.reporter?.name ?? "diesem Nutzer"} deaktivieren?`)) deactivate.mutate({ userId: report.reporter!.id });
            }} disabled={deactivate.isPending}>Melder deaktivieren</button>}
          </div>
        </article>)}
      </div>
    </div>
  </main>;
}
