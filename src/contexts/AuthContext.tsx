import {
  ReactElement,
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { getAuthCookie, isAuthExpired, setAuthCookie } from "../utils/auth";

type User = {
  display_name: string;
  roles: string[];
};

export enum LoginMethod {
  BASIC_LOGIN = "basic",
  GOOGLE_LOGIN = "google",
  MICROSOFT_LOGIN = "microsoft",
  GITHUB_LOGIN = "github",
}

export interface LoginInputs {
  username: string;
  password: string;
}

type AuthContextData = {
  user: User | undefined;
  appVersion?: string;
  isLoading: boolean;
  login: (
    input: LoginInputs,
    opts: {
      onSuccess?: (authData: string) => void;
      onError?: (err: any) => void;
    }
  ) => Promise<void>;
  logout: () => void;
  getLoginMethods: () => Promise<LoginMethod[] | undefined>;
};

type AuthProviderProps = {
  children: ReactElement;
};

const AuthContext = createContext<AuthContextData | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

const AUTH_CHECK_INTERVAL = 1000 * 60 * 60; // 60 minutes

export default function AuthProvider({ children }: AuthProviderProps) {
  const [appVersion, setAppVersion] = useState<string | undefined>();
  const [user, setUser] = useState<User>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const authCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (window.location.hash.includes("jwt")) {
      const authToken = location.hash.split("jwt=")[1];
      setAuthCookie(`Bearer ${authToken}`);
      window.location.href = "/";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    
    if (code && state) {
      handleOAuthCallback(code, state);
      return;
    }

    const cookie = getAuthCookie();
    if (!cookie) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const { ok, data } = await _fetchUser(cookie);
        if (ok) {
          setUser(data);
          setAppVersion(data.shraga_version);
        } else {
          // clear cookie if user fetch fails
          setAuthCookie(undefined);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setAuthCookie(undefined); // Clear cookie on error
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    if (state !== "google" && state !== "microsoft") {
      throw new Error("Invalid state");
    }

    try {
      const response = await fetch(`/oauth/${state}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: window.location.origin }),
      });

      if (!response.ok) {
        throw new Error("Failed the authenticate with Google");
      }

      const data = await response.json();
      setAuthCookie(`${state} ${data.token}`, data?.session_timeout || undefined);

      const { ok, data: userData } = await _fetchUser(data.token);
      if (ok) {
        setUser(userData);
        setAppVersion(userData.shraga_version);
      }
      window.location.href = "/";
    } catch (error) {
      console.error("OAuth error:", error);
    }
  };

  const _fetchUser = async (
    authToken: string | null
  ): Promise<{ ok: boolean; data: any }> => {
    const res = await fetch("/api/whoami", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken ?? "",
      },
    });
    const data = res ? await res.json() : null;
    return { ok: res.ok, data };
  };

  const login = async (
    inputs: LoginInputs,
    {
      onSuccess,
      onError,
    }: {
      onSuccess?: (authData: string) => void;
      onError?: (err: any) => void;
    }
  ) => {
    const basicAuthString = `Basic ${btoa(
      `${inputs.username}:${inputs.password}`
    )}`;
    try {
      if (!inputs.username || !inputs.password) {
        throw new Error("Email and password are required.");
      }
      const { ok, data } = await _fetchUser(basicAuthString);
      if (ok) {
        setUser(data);
        setAppVersion(data.shraga_version);
        setAuthCookie(basicAuthString, data?.session_timeout || undefined);
        onSuccess?.(basicAuthString);
      } else {
        const errMessage = data.detail;
        throw new Error(errMessage);
      }
    } catch (err: any) {
      onError?.(err);
    }
  };

  const logout = () => {
    setUser(undefined);
    setAuthCookie(undefined);
    window.location.href = "/login";
  };

  const checkAuthStatus = useCallback(async () => {
    if (!user) return;

    if (isAuthExpired()) {
      logout();
    }
  }, [user]);

  const handleWindowFocus = useCallback(() => {
    if (user) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, user]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && user) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, user]);

  useEffect(() => {
    if (!user) {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
      }
      return;
    }

    authCheckIntervalRef.current = setInterval(checkAuthStatus, AUTH_CHECK_INTERVAL);

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
      }
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkAuthStatus, handleWindowFocus, handleVisibilityChange]);

  const getLoginMethods = async (): Promise<[LoginMethod] | undefined> => {
    try {
      const response = await fetch("/auth/login_methods", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch login methods");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching login methods:", error);
      return undefined;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appVersion,
        isLoading,
        login,
        logout,
        getLoginMethods,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
