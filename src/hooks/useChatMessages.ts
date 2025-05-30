import useSWR from "swr";
import { getAuthCookie } from "../utils/auth";
import useFetch from "./useFetch";
import { useAppContext } from "../contexts/AppContext";

export default function useChatMessages(chatId: string | null) {

    const { configs } = useAppContext();
    const { fetcher } = useFetch();

    const authString = getAuthCookie();
    const swrKey = chatId ? [`chat_messages_${chatId}`, authString] : null;

    const { data, error, mutate, isValidating, isLoading } = useSWR(
        swrKey,
        async () => {
            try {
                if (!chatId || !configs?.history_enabled) return [];
                
                const messages = await fetcher(`/api/history/${chatId}/messages`);
                
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