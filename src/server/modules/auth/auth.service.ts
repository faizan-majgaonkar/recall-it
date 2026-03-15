import { randomUUID } from "crypto";
import {
  findUserByEmail,
  findUserById,
  createUser,
} from "@/server/repositories/user.repository";
import {
  createSession,
  findActiveSessionById,
  revokeSessionById,
  touchSession,
} from "@/server/repositories/session.repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSessionExpiryDate } from "@/lib/auth/session";
import { signSessionToken } from "@/lib/auth/jwt";
import { getCurrentSessionTokenPayload } from "@/lib/auth/current-user";
import { loginSchema, signupSchema } from "./auth.validators";
import type {
  AuthResult,
  LoginInput,
  SafeUser,
  SignupInput,
} from "./auth.types";

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const parsed = signupSchema.parse(input);

  const existingUser = await findUserByEmail(parsed.email);

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(parsed.password);

  const user = await createUser({
    name: parsed.name,
    email: parsed.email,
    passwordHash,
  });

  const tokenJti = randomUUID();

  const session = await createSession({
    userId: user.id,
    tokenJti,
    expiresAt: getSessionExpiryDate(),
  });

  const token = await signSessionToken({
    sub: user.id,
    sid: session.id,
    jti: tokenJti,
    email: user.email,
  });

  return {
    user: toSafeUser(user),
    token,
    sessionId: session.id,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const parsed = loginSchema.parse(input);

  const user = await findUserByEmail(parsed.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(
    parsed.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const tokenJti = randomUUID();

  const session = await createSession({
    userId: user.id,
    tokenJti,
    expiresAt: getSessionExpiryDate(),
  });

  const token = await signSessionToken({
    sub: user.id,
    sid: session.id,
    jti: tokenJti,
    email: user.email,
  });

  return {
    user: toSafeUser(user),
    token,
    sessionId: session.id,
  };
}

export async function logoutCurrentSession() {
  const payload = await getCurrentSessionTokenPayload();

  if (!payload) {
    return { success: true };
  }

  await revokeSessionById(payload.sessionId);

  return { success: true };
}

export async function getAuthenticatedUser() {
  const payload = await getCurrentSessionTokenPayload();

  if (!payload) {
    return null;
  }

  const session = await findActiveSessionById(payload.sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const user = await findUserById(payload.userId);

  if (!user) {
    return null;
  }

  await touchSession(session.id);

  return toSafeUser(user);
}
