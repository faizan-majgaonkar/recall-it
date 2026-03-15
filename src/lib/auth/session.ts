import { AUTH_SESSION_DURATION_MS } from "./constants";

export function getSessionExpiryDate() {
  return new Date(Date.now() + AUTH_SESSION_DURATION_MS);
}
