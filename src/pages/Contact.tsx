import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { trpc } from "@/providers/trpc";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const send = trpc.contact.send.useMutation({ onSuccess: () => setSent(true) });
  return <div className="min-h-screen"><Header onOpenUpload={() => undefined} /><main className="mx-auto max-w-5xl px-5 py-16 sm:px-6"><p className="label-caps mb-4 text-tang">Kontakt</p><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><h1 className="display-xl text-5xl sm:text-7xl">Schreib uns.</h1><p className="mt-6 text-lg leading-relaxed text-sagedark">Du hast eine Frage, eine Idee oder möchtest mit uns zusammenarbeiten? Wir freuen uns auf deine Nachricht.</p></div><div className="card-offset p-7 sm:p-9">{sent ? <div><h2 className="font-display text-2xl font-bold">Danke für deine Nachricht.</h2><p className="mt-3 text-sagedark">Wir melden uns so bald wie möglich bei dir.</p></div> : <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); send.mutate(form); }}><input className="input-line" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><input className="input-line" type="email" placeholder="E-Mail-Adresse" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><textarea className="input-line min-h-40 resize-y" placeholder="Deine Nachricht" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={10} /><button className="btn-tang w-full" disabled={send.isPending}>{send.isPending ? "Wird gesendet …" : "Nachricht senden"}</button>{send.error && <p className="text-sm text-red-700">{send.error.message}</p>}</form>}</div></div></main><Footer /></div>;
}
