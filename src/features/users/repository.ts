import "server-only";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LibraryUser, UserRole } from "@/features/library/types";

const scrypt = promisify(nodeScrypt);

export async function listUsers(): Promise<LibraryUser[]> {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });
  return users.map(toLibraryUser);
}

export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { role: true },
  });
  return user;
}

export async function getActiveUserById(id: string): Promise<LibraryUser | undefined> {
  const user = await prisma.user.findUnique({
    where: { userID: parseId(id) },
    include: { role: true },
  });
  return user?.isActive ? toLibraryUser(user) : undefined;
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return null;

  const [salt, storedHex] = user.passwordHash.split(":");
  if (!salt || !storedHex || !/^[a-f\d]+$/i.test(storedHex)) {
    throw new Error(`Stored password hash for "${user.email}" is invalid.`);
  }
  const storedHash = Buffer.from(storedHex, "hex");
  const candidateHash = (await scrypt(password, salt, storedHash.length)) as Buffer;
  if (!timingSafeEqual(storedHash, candidateHash)) return null;

  return toLibraryUser(user);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<LibraryUser> {
  const roleID = await getRoleId("member");
  try {
    const user = await prisma.user.create({
      data: {
        fullName: input.name.trim(),
        email: normalizeEmail(input.email),
        passwordHash: await hashPassword(input.password),
        roleID,
      },
      include: { role: true },
    });
    return toLibraryUser(user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("An account with this email already exists.", {
        cause: error,
      });
    }
    throw error;
  }
}

export async function findOrCreateGoogleUser(input: {
  name: string;
  email: string;
}): Promise<LibraryUser> {
  const email = normalizeEmail(input.email);
  const roleID = await getRoleId("member");
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      fullName: input.name.trim(),
      email,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
      roleID,
    },
    include: { role: true },
  });
  if (!user.isActive) throw new Error("This account is inactive.");
  return toLibraryUser(user);
}

export async function setUserActive(id: string, active: boolean) {
  const userID = parseId(id);
  try {
    const user = await prisma.user.update({
      where: { userID },
      data: { isActive: active },
      include: { role: true },
    });
    return toLibraryUser(user);
  } catch (error) {
    if (isMissingRecordError(error)) return undefined;
    throw error;
  }
}

async function getRoleId(roleName: UserRole): Promise<number> {
  const role = await prisma.role.findUnique({ where: { roleName } });
  if (!role) {
    throw new Error('Database roles are not initialized. Run "npm run db:seed".');
  }
  return role.roleID;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${digest.toString("hex")}`;
}

function toLibraryUser(user: {
  userID: number;
  fullName: string;
  email: string;
  role: { roleName: string };
  isActive: boolean;
  createdAt: Date;
}): LibraryUser {
  if (user.role.roleName !== "admin" && user.role.roleName !== "member") {
    throw new Error(`Unsupported database role "${user.role.roleName}".`);
  }
  return {
    id: String(user.userID),
    name: user.fullName,
    email: user.email,
    role: user.role.roleName,
    active: user.isActive,
    joinedAt: user.createdAt.toISOString().slice(0, 10),
  };
}

export function parseId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error("The requested record ID is invalid.");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 2_147_483_647) {
    throw new Error("The requested record ID is invalid.");
  }
  return parsed;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isMissingRecordError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}
