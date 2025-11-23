import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("Clearing database...");

  // Delete in order due to foreign key constraints
  await prisma.movieEvent.deleteMany({});
  console.log("✓ Deleted all movie events");

  await prisma.movie.deleteMany({});
  console.log("✓ Deleted all movies");

  await prisma.cinema.deleteMany({});
  console.log("✓ Deleted all cinemas");

  console.log("\n✅ Database cleared successfully!");
}

clearDatabase()
  .catch((e) => {
    console.error("Error clearing database:");
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
