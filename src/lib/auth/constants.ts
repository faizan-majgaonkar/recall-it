import { env } from "@/lib/env";

export const AUTH_COOKIE_NAME = "recallit_session";

export const AUTH_SESSION_DURATION_SECONDS = env.JWT_EXPIRES_IN_SECONDS;

export const AUTH_SESSION_DURATION_MS = AUTH_SESSION_DURATION_SECONDS * 1000;
