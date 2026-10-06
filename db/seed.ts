import { getDb } from "../server/queries/connection.js";

async function seed() {
  getDb();
  console.log("No demo content is seeded. Wyfare starts with real community content only.");
  process.exit(0);
}

seed();
