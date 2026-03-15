import { jwtVerify } from "jose";
import { env } from "@/lib/env";

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export async function isValidSessionToken(token: string) {
  try {
    await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    return true;
  } catch {
    return false;
  }
}
