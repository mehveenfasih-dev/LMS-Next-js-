import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { roleName: "admin" },
    update: {},
    create: { roleName: "admin" },
  });
  await prisma.role.upsert({
    where: { roleName: "member" },
    update: {},
    create: { roleName: "member" },
  });

  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Library Admin";
  if (!email && !password) return;
  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set INITIAL_ADMIN_EMAIL and a 12-character INITIAL_ADMIN_PASSWORD to seed an administrator.",
    );
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      fullName: name,
      email,
      passwordHash,
      roleID: adminRole.roleID,
    },
  });
}

main()
  .catch((error) => {
    console.error("Prisma seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
