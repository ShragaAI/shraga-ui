import useSWR from "swr";
import { getAuthCookie } from "../utils/auth";
import { fetcher } from "./useFetch";
import { UIConfig } from "../contexts/AppContext";

export default function useChatMessages(configs: UIConfig | undefined, chatId: string | null) {
    const headers: { [key: string]: string } = {
        "Content-Type": "application/json",
    };
  
    const authString = getAuthCookie();
    if (authString) {
        headers["Authorization"] = authString;
    }
    
    const swrKey = chatId ? [`chat_messages_${chatId}`, authString] : null;

    const { data, error, mutate, isValidating, isLoading } = useSWR(
        swrKey,
        async () => {
            try {
                if (!chatId || !configs?.history_enabled) return [];
                
                const messages = await fetcher(`/api/history/${chatId}/messages`, {
                    headers,
                });
                
                return messages.map((message: any) => ({
                    ...message,
                    retrieval_results: message.retrieval_results,
                }));
            } catch (error) {
                console.error(`Error fetching messages for chat ${chatId}:`, error);
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