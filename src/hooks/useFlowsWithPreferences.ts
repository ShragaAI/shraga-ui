import useSWR from "swr";

import useFetch from "./useFetch";
import { Flow } from "../contexts/AppContext";

export default function useFlowsWithPreferences() {
  const { fetcher } = useFetch();

  const { data, error, mutate, isValidating, isLoading } = useSWR<Flow[]>(
    "flows_with_preferences",
    async () => {
      return await fetcher("/api/flows/");
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return { data, error, mutate, isValidating, isLoading };
}
