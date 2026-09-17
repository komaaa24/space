import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPgAdapterConfig } from "../lib/database-url";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(getPgAdapterConfig());
const prisma = new PrismaClient({ adapter });

async function main() {
  const ownerPassword = await bcrypt.hash("chatspace2026", 10);
  await prisma.user.upsert({
    where: { email: "abdullokh@chatspace.uz" },
    update: {},
    create: {
      email: "abdullokh@chatspace.uz",
      passwordHash: ownerPassword,
      role: "OWNER",
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "demo-valvoline" },
    update: {},
    create: {
      id: "demo-valvoline",
      company: "Valvoline Uzbekistan",
      plan: "PRO",
      status: "ACTIVE",
    },
  });

  const clientPassword = await bcrypt.hash("valvoline2026", 10);
  await prisma.user.upsert({
    where: { email: "valvoline@chatspace.uz" },
    update: {},
    create: {
      email: "valvoline@chatspace.uz",
      passwordHash: clientPassword,
      role: "CLIENT_ADMIN",
      clientId: client.id,
    },
  });

  console.log("Seed tayyor:");
  console.log("  Owner  -> abdullokh@chatspace.uz / chatspace2026");
  console.log("  Mijoz  -> valvoline@chatspace.uz / valvoline2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
