export const PUBLIC_AUTH_ROUTES = ["/login", "/signup"] as const;

export const PROTECTED_ROUTES = ["/documents"] as const;

export const DEFAULT_LOGIN_REDIRECT = "/documents";
export const DEFAULT_LOGOUT_REDIRECT = "/login";
