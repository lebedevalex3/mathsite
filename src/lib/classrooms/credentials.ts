import { randomInt } from "node:crypto";

import { prisma } from "@/src/lib/db/prisma";

const USERNAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const MIN_STUDENT_USERNAME_LENGTH = 5;

function randomFromAlphabet(alphabet: string, length: number) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += alphabet[randomInt(0, alphabet.length)];
  }
  return result;
}

export function isValidStudentUsername(value: string) {
  return /^[a-z0-9]{5,32}$/.test(value);
}

export function normalizeStudentUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function generateUniqueStudentUsername() {
  for (let i = 0; i < 20; i += 1) {
    const candidate = `s${randomFromAlphabet(USERNAME_ALPHABET, 7)}`;
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate unique username");
}

export function generateTemporaryPassword() {
  return randomFromAlphabet(PASSWORD_ALPHABET, 10);
}

export async function generateUniqueJoinCode() {
  for (let i = 0; i < 20; i += 1) {
    const candidate = randomFromAlphabet(JOIN_CODE_ALPHABET, 8);
    const existing = await prisma.classGroup.findUnique({
      where: { joinCode: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate unique join code");
}
