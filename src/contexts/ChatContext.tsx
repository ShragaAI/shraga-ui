import _ from "lodash";
import React, { 
  createContext, 
  useContext, 
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { KeyedMutator } from "swr";
import { v4 as uuid } from "uuid";

import useChatHistory from "../hooks/useChatHistory";
import useChatMessages from "../hooks/useChatMessages";
import { getAuthCookie } from "../utils/auth";
import useFetch from "../hooks/useFetch";
import { useAppContext, transformPreferences, Flow, Chat as ChatType, Message, Feedback } from "./AppContext";

interface ChatContextType {
  selectedChat: ChatType | null;
  canReplyToBot: boolean;
  selectChat: (chatId: string) => void;
  chatUpdated: boolean;
  setChatUpdated: React.Dispatch<React.SetStateAction<boolean>>;
  chats: ChatType[];
  createChat: (flow: Flow) => void;
  refreshChatHistory: KeyedMutator<ChatType[]>;
  sendMessage: (
    text: string,
    chatId: string,
    opts: {
      rtl?: boolean;
      onSuccess?: () => void;
      onError?: (err: any) => void;
    }
  ) => Promise<void>;
  abortMessage: () => void;
  submitFeedback: (
    feedbackData: Feedback,
    chat: ChatType,
    message: Message,
    opts: {
      onSuccess?: () => void;
      onError?: (err: any) => void;
    },
    feedbackText?: string
  ) => Promise<void>;
  isLoadingChat: boolean;
}

const defaultContext: ChatContextType = {
  selectedChat: null,
  canReplyToBot: false,
  selectChat: () => {},
  chatUpdated: false,
  setChatUpdated: () => {},
  chats: [],
  createChat: () => {},
  refreshChatHistory: async () => [],
  sendMessage: async () => {},
  abortMessage: () => {},
  submitFeedback: async () => {},
  isLoadingChat: false
};

const ChatContext = createContext<ChatContextType>(defaultContext);

export const useChatContext = () => useContext(ChatContext);

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider = ({ 
  children
}: ChatProviderProps) => {
  const { configs, flows, setIsSessionEditorOpen } = useAppContext();

  const { data: chatHistory, mutate: refreshChatHistory } = useChatHistory();
  const { fetchWithTimeout } = useFetch();

  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatUpdated, setChatUpdated] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set());

  const { 
    data: chatMessages
  } = useChatMessages(selectedChatId);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentChatRef = useRef<string | null>(null);

  const selectedChat = useMemo<ChatType | null>(
    () => {
      const chat = chats.find((c) => c.id === selectedChatId) ?? null;
      if (chat && flows) {
        const flow = flows.find((f) => f.id === chat.flow.id);
        if (flow) {
          return {
            ...chat,
            flow: {
              ...chat.flow,
              preferences: transformPreferences(flow.preferences)
            }
          };
        }
      }
      return chat;
    },
    [chats, selectedChatId, flows]
  );

  const canReplyToBot = useMemo(() => {
    return (selectedChat?.flow.preferences?.history_window > 0 || configs?.history_enabled) ?? false;
  }, [selectedChat, configs]);

  useEffect(() => {
    if (!configs || !flows || selectedChat || chatHistory === undefined) return;

    if (chatHistory.length) {
      const startFlow: Flow = {
        id: chatHistory[0].flow.id,
        description: "",
      };

      const flow = flows.find((flow) => flow.id === startFlow.id);
      if (flow) {
        startFlow.preferences = transformPreferences(flow.preferences);
      }
      createChat(startFlow);
      return;
    }

    const defaultFlow = configs.default_flow;
    if (Array.isArray(defaultFlow) && defaultFlow.length > 1) {
      setIsSessionEditorOpen(true);
      return;
    }

    const defaultFlowId = Array.isArray(defaultFlow) ? defaultFlow[0] : defaultFlow;
    if (defaultFlowId) {
      const flow = flows.find((flow) => flow.id === defaultFlowId);
      if (flow) {
        createChat(flow);
        return;
      }
    }

    setIsSessionEditorOpen(true);
  }, [flows, configs, chatHistory]);

  useEffect(() => {
    if (chatHistory)
      setChats(chats => 
        _.unionBy(
          chatHistory,
          chats.filter((c) => c.draft),
          "id"
        )
      );
  }, [chatHistory]);

  useEffect(() => {
    if (!selectedChatId || !chatMessages || !chatMessages.length) return;
    
    setChats((prevChats) => {
      const updatedChats = [...prevChats];
      const selectedChatIndex = updatedChats.findIndex(chat => chat.id === selectedChatId);
      
      if (selectedChatIndex !== -1) {
        updatedChats[selectedChatIndex] = {
          ...updatedChats[selectedChatIndex],
          messages: chatMessages,
        };
      }
      
      return updatedChats;
    });
    
    setLoadedChats(prev => new Set([...prev, selectedChatId]));
    setIsLoadingChat(false);
  }, [chatMessages, selectedChatId]);

  useEffect(() => {
    if (!chatHistory || !chatHistory.length || loadedChats.size > 0) return;
    
    const newestChatId = chatHistory[0].id;
    selectChat(newestChatId);
  }, [chatHistory, loadedChats]);

  const createChat = (flow: Flow) => {
    abortMessage();
    const chat: ChatType = {
      id: uuid(),
      draft: true,
      flow: flow,
      flow_id: flow.id,
      messages: [],
      timestamp: new Date(),
    };
    setChats(chats => [chat, ...chats]);
    setSelectedChatId(chat.id);

    setLoadedChats(prev => new Set([...prev, chat.id]));
  };

  const selectChat = (chatId: string) => {
    if (!chats.find((c) => c.id === chatId)) return;

    if (!loadedChats.has(chatId) && chatId !== selectedChatId) {
      setIsLoadingChat(true);
    }

    setSelectedChatId(chatId);

    if (currentChatRef.current !== chatId) abortMessage();
    currentChatRef.current = chatId;
  };

  const _addMessageToChat = (chatId: string, message: Message) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.id === chatId);
      if (chatIndex === -1) return prevChats;

      const updatedChat = {
        ...prevChats[chatIndex],
        messages: [...prevChats[chatIndex].messages, message],
      };

      const newChats = prevChats.filter((c) => c.id !== chatId);;
      return [updatedChat, ...newChats];
    });
    setChatUpdated(true);
  };

  const sendMessage = async (
    text: string,
    chatId: string,
    {
      rtl = false,
      onSuccess,
      onError,
    }: {
      rtl?: boolean;
      onSuccess?: () => void;
      onError?: (err: any) => void;
    }
  ) => {
    const currentChatId = chatId;
    currentChatRef.current = chatId;
    abortControllerRef.current = new AbortController();

    try {
      _addMessageToChat(currentChatId, { text, msg_type: "user", rtl });
      const chat = chats.find((c) => c.id === currentChatId);
      if (!chat) return;

      const latestMessage = chat.messages[chat.messages.length - 1];
      const res = await fetchWithTimeout("/api/flows/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthCookie() ?? "",
          redirect: 'follow',
          credentials: 'include'
        },
        body: JSON.stringify({
          question: text,
          flow_id: chat.flow.id,
          preferences: chat.flow.preferences ?? {},
          chat_id: chat.id,
          position: (latestMessage && latestMessage.position) ? latestMessage.position + 1 : 0,
          chat_history: chat.messages.map((m) => {
            return {
              timestamp: m.timestamp,
              text: m.text,
              msg_type: m.msg_type,
            };
          }),
        }),
        timeout: 300000,
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (res.ok && currentChatRef.current === chatId) {
        _addMessageToChat(currentChatId, {
          text: data.response_text,
          msg_type: "system",
          allowReply: data.allow_reply,
          rtl,
          retrieval_results: data.retrieval_results,
          trace: data.trace,
          payload: data.payload,
        });
        onSuccess?.();
        return;
      }
      const errMessage = data.detail;
      if (res.status === 400) {
        throw new Error(errMessage);
      }
      _addMessageToChat(currentChatId, {
        text: errMessage ?? "An error occurred",
        msg_type: "system",
        rtl,
        error: true,
        trace: data.trace,
        payload: data.payload,
      });
      onSuccess?.();
    } catch (err: any) {
      if (err.name === "AbortError") {
        const chatId = currentChatRef.current;
        const chatIndex = chats.findIndex((c) => c.id === chatId);
        if (chatIndex === -1) return;

        _addMessageToChat(chatId, {
          text: "The request was aborted.",
          msg_type: "system",
          rtl,
          error: true,
        });
        onSuccess?.();
      } else if (err.name === "TimeoutError") {
        _addMessageToChat(currentChatId, {
          text: "The server failed to respond in time. Please try again later.",
          msg_type: "system",
          rtl,
          error: true,
        });
        onSuccess?.();
      } else {
        setChats((prevChats) => {
          const prevChatsCopy = prevChats.slice();
          const chatIndex = prevChatsCopy.findIndex(
            (c) => c.id === currentChatId
          );
          if (chatIndex !== -1) {
            prevChatsCopy[chatIndex].messages.pop();
          }
          return prevChatsCopy;
        });
        onError?.(err);
      }
    } finally {
      if (currentChatRef.current === chatId) {
        abortControllerRef.current = null;
        currentChatRef.current = null;
      }
    }
  };

  const abortMessage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const submitFeedback = async (
    feedbackData: Feedback,
    chat: ChatType,
    message: Message,
    {
      onSuccess,
      onError,
    }: {
      onSuccess?: () => void;
      onError?: (err: any) => void;
    },
    feedbackText?: string
  ) => {
    try {
      const res = await fetch("/api/history/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthCookie() ?? "",
        },
        body: JSON.stringify({
          chat_id: chat.id,
          user_id: chat.user_id,
          flow_id: chat.flow.id,
          msg_id: message.msg_id ?? "",
          position: message.position,
          feedback: feedbackData,
          feedback_text: feedbackText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess?.();
        return;
      }
      const errMessage = data.detail;
      throw new Error(errMessage);
    } catch (err: any) {
      onError?.(err);
    }
  };
  
  return (
    <ChatContext.Provider value={{ 
      selectedChat,
      canReplyToBot,
      selectChat,
      chatUpdated,
      setChatUpdated,
      chats,
      createChat,
      refreshChatHistory,
      sendMessage,
      abortMessage,
      submitFeedback,
      isLoadingChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;