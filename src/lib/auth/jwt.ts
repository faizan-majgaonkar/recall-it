import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { AUTH_SESSION_DURATION_SECONDS } from "./constants";

export type SessionJwtPayload = {
  sub: string; // user id
  sid: string; // session id
  jti: string; // token id
  email: string;
};

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export async function signSessionToken(
  payload: SessionJwtPayload,
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    sid: payload.sid,
    jti: payload.jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey, {
    algorithms: ["HS256"],
  });

  return {
    sub: payload.sub,
    sid: payload.sid,
    jti: payload.jti,
    email: payload.email,
    exp: payload.exp,
    iat: payload.iat,
  };
}
