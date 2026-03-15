import { getAuthCookie } from "./cookies";
import { verifySessionToken } from "./jwt";

export async function getCurrentSessionTokenPayload() {
  const token = await getAuthCookie();

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);

    if (
      !payload.sub ||
      typeof payload.sub !== "string" ||
      !payload.sid ||
      typeof payload.sid !== "string" ||
      !payload.jti ||
      typeof payload.jti !== "string" ||
      !payload.email ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      tokenJti: payload.jti,
      email: payload.email,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
