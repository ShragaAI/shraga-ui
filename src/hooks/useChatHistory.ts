import useSWR from "swr";
import { Chat, useAppContext } from "../contexts/AppContext";
import { getAuthCookie } from "../utils/auth";
import useFetch from "./useFetch";

export default function useChatHistory() {

  const { configs: uiConfig } = useAppContext();
  const { fetcher } = useFetch();

  const headers: { [key: string]: string } = {};

  const authString = getAuthCookie();
  if (authString) {
    headers["Authorization"] = authString;
  }
  
  const swrKey = (authString && uiConfig && uiConfig.history_enabled) ? ["chat_history", authString] : null;

  const { data, error, mutate, isValidating, isLoading } = useSWR<Chat[]>(
    swrKey,
    async () => {
      try {
        const data: any[] = await fetcher("/api/history/list", {
          headers,
        });
        const transformedData = data.map((chat) => ({
          ...chat,
          id: chat.id || chat.chat_id,
          flow: {
            id: chat.messages[0]?.flow_id ?? "n/a",
          },
          timestamp: new Date(chat.timestamp),
          preferences: chat.messages[0]?.preferences,
          messages: chat.messages.map((message: any) => ({
            ...message,
            retrieval_results: message.retrieval_results,
          })),
        }));
        return transformedData;
      } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  return { data, error, mutate, isValidating, isLoading };
}
