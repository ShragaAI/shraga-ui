import { getCookie, setCookie, deleteCookie } from "./cookieUtils";

const DEFAULT_AUTH_COOKIE_HOURS = 24;

export const getAuthCookie = (): string | null => {
  return getCookie("auth");
};

export const setAuthCookie = (authString?: string, hours: number = DEFAULT_AUTH_COOKIE_HOURS): void => {
  if (authString) {
    setCookie("auth", authString, hours);
  } else {
    deleteCookie("auth");
  }
};
