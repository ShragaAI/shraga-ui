import { getCookie, setCookie, deleteCookie } from "./cookieUtils";

const DEFAULT_AUTH_COOKIE_HOURS = 24;
const AUTH_EXPIRY_KEY = "auth_expiry_time";

export const getAuthCookie = (): string | null => {
  return getCookie("auth");
};

export const setAuthExpiryTime = (hours: number = 24): void => {
  const expiryTime = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
}

export const clearAuthExpiryTime = () => {
  localStorage.removeItem(AUTH_EXPIRY_KEY);
}

export const isAuthExpired = (): boolean => {
  const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (!expiryTime) {
    return true;
  }
  return Date.now() > parseInt(expiryTime);
}

export const setAuthCookie = (authString?: string, hours: number = DEFAULT_AUTH_COOKIE_HOURS): void => {
  if (authString) {
    setCookie("auth", authString, hours);
    setAuthExpiryTime(hours);
  } else {
    deleteCookie("auth");
    clearAuthExpiryTime();
  }
};