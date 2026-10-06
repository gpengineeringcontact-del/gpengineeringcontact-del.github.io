import { env } from "./env.js";

async function sendEmail(to: string, subject: string, html: string) {
  if (!env.resendApiKey || !env.mailFrom) {
    throw new Error("E-Mail-Versand ist nicht konfiguriert. RESEND_API_KEY und MAIL_FROM fehlen.");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [to],
      subject,
      html,
    }),
  });
  if (!response.ok) throw new Error("Die E-Mail konnte nicht versendet werden.");
}

export async function sendPasswordResetEmail(to: string, token: string) {
  await sendEmail(
    to,
    "Dein Wyfare-Passwort zurücksetzen",
    `<p>Du hast das Zurücksetzen deines Wyfare-Passworts angefordert.</p><p><a href="${env.appUrl}/passwort-reset?token=${encodeURIComponent(token)}">Neues Passwort setzen</a></p><p>Der Link ist 30 Minuten gültig.</p>`,
  );
}

export async function sendRegistrationEmail(to: string, name: string) {
  await sendEmail(
    to,
    "Willkommen bei Wyfare",
    `<p>Hallo ${escapeHtml(name)},</p><p>dein Wyfare-Konto wurde erfolgreich erstellt.</p><p>Schön, dass du dabei bist.</p><p><a href="${env.appUrl}">Zu Wyfare</a></p>`,
  );
}

export async function sendPurchaseConfirmationEmail(to: string, name: string) {
  await sendEmail(
    to,
    "Dein Wyfare-Zugang ist aktiv",
    `<p>Hallo ${escapeHtml(name)},</p><p>deine Zahlung über 25,00 € wurde erfolgreich bestätigt.</p><p>Dein Zugang zur Wyfare-Community ist jetzt freigeschaltet.</p><p><a href="${env.appUrl}">Zu Wyfare</a></p>`,
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}
