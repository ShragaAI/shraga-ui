import React, { createContext, useContext } from 'react';
import Chat from "../components/Chat/Chat";
import { Chat as ChatType } from "./AppContext";

interface ChatComponentProps {
    readOnly?: boolean;
    chatData?: ChatType;
    [key: string]: any;
}

interface ChatContextType {
  ChatComponent: React.ComponentType<ChatComponentProps>;
}

const ChatContext = createContext<ChatContextType>({
  ChatComponent: Chat
});

export const useChatComponent = () => useContext(ChatContext);

interface ChatProviderProps {
  children: React.ReactNode;
  customChatComponent?: React.ComponentType;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  customChatComponent 
}) => {
  const ChatComponent = customChatComponent || Chat;
  
  return (
    <ChatContext.Provider value={{ ChatComponent }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;