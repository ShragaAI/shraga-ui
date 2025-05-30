import useSWR from "swr";
import { BareFetcher, PublicConfiguration } from "swr/_internal";
import { toast } from "react-toastify";

import { getAuthCookie } from "../utils/auth";
import { useAuthContext } from "../contexts/AuthContext";


export default function useFetch<T = any>(
  path?: string,
  opts = {} as RequestInit,
  config?: Partial<PublicConfiguration<T, any, BareFetcher<T>>>
) {

  const { logout } = useAuthContext();

  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };

  const authString = getAuthCookie();
  if (authString) {
    headers["Authorization"] = authString;
  }

  const fetcher = async (path: string, opts = {} as RequestInit) => {
    const response = await fetch(path, {
      headers,
      ...opts,
    });
  
    if (response.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }
  
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    data.error && toast.error(data.error);
    throw new Error(data.detail || "API Error");
  }

  const fetchWithTimeout = async (
    resource: string, 
    options: RequestInit & { timeout?: number } = {}
  ): Promise<Response> => {
    const { timeout = 120000, signal, ...fetchOptions } = options; // default timeout of 120 seconds
    
    const timeoutId = setTimeout(() => {
        if (signal && !signal.aborted) {
            (signal as any).aborted = true;
            (signal as any).abort = () => {};
        }
    }, timeout);
  
    try {
        const response = await fetch(resource, {
            ...fetchOptions,
            signal,
        });
  
        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized");
        }
  
        return response;
    } finally {
        clearTimeout(timeoutId);
    };
  };

  const swrFetcher = async (path: string): Promise<T> => {
    const response = await fetch(path, {
      headers: headers,
      ...opts,
    });

    if (response.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }

    const data = await response.json();
    if (response.ok) {
      return data;
    }
    data.error && toast.error(data.error);
    throw new Error();
  };

  const { data, error, mutate, isValidating, isLoading } = useSWR<T>(
    path || null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...config,
    }
  );

  return { data, error, mutate, isValidating, isLoading, fetcher, fetchWithTimeout };
}
