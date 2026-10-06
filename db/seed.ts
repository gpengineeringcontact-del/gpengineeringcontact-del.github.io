import { getDb } from "../server/queries/connection.js";
import { users, posts, threads, threadReplies } from "./schema";

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Demo-Mitglieder (kein Login, nur als Autoren sichtbar)
  const demoUsers = [
    { unionId: "demo-leon", name: "Leon", exchangeRole: "im_ausland" as const },
    { unionId: "demo-mia", name: "Mia", exchangeRole: "im_ausland" as const },
    { unionId: "demo-jonas", name: "Jonas", exchangeRole: "planung" as const },
    { unionId: "demo-lara", name: "Lara", exchangeRole: "alumni" as const },
    { unionId: "demo-sophie", name: "Sophie", exchangeRole: "alumni" as const },
  ];

  const userIds: Record<string, number> = {};
  for (const u of demoUsers) {
    const existing = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.unionId, u.unionId),
    });
    if (existing) {
      userIds[u.unionId] = existing.id;
      continue;
    }
    const [created] = await db.insert(users).values(u).returning({ id: users.id });
    userIds[u.unionId] = created.id;
  }

  const existingPosts = await db.query.posts.findMany({ limit: 1 });
  if (existingPosts.length === 0) {
    await db.insert(posts).values([
      {
        authorId: userIds["demo-leon"],
        caption:
          "Mein erster Hike mit der Gastfamilie! Die Natur hier ist einfach unglaublich.",
        country: "Kanada",
        locationLabel: "British Columbia",
        imageUrl: UNSPLASH("photo-1501504905252-473c47e087f8"),
      },
      {
        authorId: userIds["demo-mia"],
        caption:
          "Highschool-Football-Spiele sind genau so, wie man es aus Filmen kennt!",
        country: "USA",
        locationLabel: "Texas",
        imageUrl: UNSPLASH("photo-1541339907198-e08756dedf3f"),
      },
      {
        authorId: userIds["demo-sophie"],
        caption:
          "Roadtrip-Wochenende an der Küste. Ich will nie wieder weg hier.",
        country: "Australien",
        locationLabel: "Great Ocean Road",
        imageUrl: UNSPLASH("photo-1506929562872-bb421503ef21"),
      },
      {
        authorId: userIds["demo-lara"],
        caption:
          "Ein Jahr später zurück am Flughafen – diesmal mit Koffer voller Erinnerungen.",
        country: "Neuseeland",
        locationLabel: "Auckland",
        imageUrl: UNSPLASH("photo-1469854523086-cc02fe5d8800"),
      },
      {
        authorId: userIds["demo-leon"],
        caption:
          "Camping unter freiem Himmel. Kanada, du hast mein Herz geklaut.",
        country: "Kanada",
        locationLabel: "Banff National Park",
        imageUrl: UNSPLASH("photo-1488646953014-85cb44e25828"),
      },
      {
        authorId: userIds["demo-mia"],
        caption:
          "Wochenmarkt am Samstagmorgen – meine Gastfamilie kocht heute texanisch.",
        country: "USA",
        locationLabel: "Austin",
        imageUrl: UNSPLASH("photo-1530521954074-e64f6810b32d"),
      },
    ]);
  }

  const existingThreads = await db.query.threads.findMany({ limit: 1 });
  if (existingThreads.length === 0) {
    const [t1] = await db.insert(threads).values({
      authorId: userIds["demo-jonas"],
      title: "Visum für Kanada – wie lange hat es bei euch gedauert?",
      body: "Ich fange gerade mit den Unterlagen an und lese überall etwas anderes. Wie lange hat der Prozess bei euch gedauert?",
    }).returning({ id: threads.id });
    const t1Id = t1.id;
    await db.insert(threadReplies).values([
      {
        threadId: t1Id,
        authorId: userIds["demo-leon"],
        content:
          "Bei mir waren es knapp 6 Wochen bis zur eTA-Bestätigung bzw. Study Permit. Fang früh an, die Biometrie-Termine sind je nach Stadt rar.",
      },
      {
        threadId: t1Id,
        authorId: userIds["demo-sophie"],
        content:
          "Tipp: Mach den medizinischen Check direkt nach der Einreichung, das hat bei mir zwei Wochen gespart.",
      },
    ]);

    const [t2] = await db.insert(threads).values({
      authorId: userIds["demo-lara"],
      title: "Taschengeld in den USA – was ist realistisch?",
      body: "Meine Eltern fragen, was sie einplanen sollen. Was habt ihr im Monat gebraucht?",
    }).returning({ id: threads.id });
    const t2Id = t2.id;
    await db.insert(threadReplies).values([
      {
        threadId: t2Id,
        authorId: userIds["demo-mia"],
        content:
          "Ich komme mit etwa 250 € im Monat gut hin. Football-Spiele und Diner-Besuche inklusive.",
      },
    ]);
  }

  console.log("Done.");
  process.exit(0);
}

seed();
