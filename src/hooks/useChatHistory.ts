import useSWR from "swr";
import { Chat, UIConfig } from "../contexts/AppContext";
import { getAuthCookie } from "../utils/auth";
import { fetcher } from "./useFetch";

export default function useChatHistory(uiConfig: UIConfig | undefined) {
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };

  const authString = getAuthCookie();
  if (authString) {
    headers["Authorization"] = authString;
  }
  const swrKey = authString ? ["chat_history", authString] : null;

  const { data, error, mutate, isValidating, isLoading } = useSWR<Chat[]>(
    swrKey,
    async () => {
      try {
        if (!uiConfig?.history_enabled) {
          return [];
        }
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
